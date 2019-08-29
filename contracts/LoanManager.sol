pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "./Configuration.sol";
import "./PriceOracle.sol";
import "./TokenManager.sol";
import "./LiquidityPools.sol";
import "./DepositManager.sol";
import "./Loan.sol";
import "./AccountManager.sol";


// The main contract which handles everything related to loan.
contract LoanManager is Ownable, Pausable {
    using SafeERC20 for ERC20;
    using SafeMath for uint;
    using FixedMath for uint;

    Configuration private _config;
    PriceOracle private _priceOracle;
    TokenManager private _tokenManager;
    LiquidityPools private _liquidityPools;
    DepositManager private _depositManager;
    AccountManager private _accountManager;

    event LoanSuccessful(address indexed user, Loan loan);
    event RepayLoanSuccessful(address indexed user, Loan loan);
    event AddCollateralSuccessful(address indexed user, Loan loan);

    uint[] private _loanTerms;

    mapping(uint => bool) private _isValidLoanTerm;

    /// loan asset -> collateral asset -> enabled
    /// An loan asset pair refers to loan token A using collateral B, i.e., "B -> A",
    /// Loan-related transactions can happen only if "B -> A" is enabled.
    mapping(address => mapping(address => bool)) private _isLoanAssetPairEnabled;

    // User address -> A list of Loans
    mapping(address => Loan[]) private _loansByUser;

    uint private _numLoans;

    /// This struct is used internally in the `loan` function to avoid
    /// "CompilerError: Stack too deep, try removing local variables"
    struct LoanLocalVars {
        uint totalCollateralAmount;
        uint remainingCollateralAmount;
        uint loanAssetPrice;
        uint collateralAssetPrice;
        uint currCollateralRatio;
        uint minCollateralRatio;
        uint interestRate;
        uint liquidationDiscount;
    }

    // PUBLIC  -----------------------------------------------------------------

    function loan(
        uint term,
        address loanAsset,
        address collateralAsset,
        uint loanAmount,
        uint collateralAmount,
        bool useFreedCollateral
    )
        public
        whenNotPaused
        returns (Loan)
    {
        require(_config.isUserActionsLocked() == false, "User actions are locked, please try again later");
        require(_isLoanAssetPairEnabled[loanAsset][collateralAsset], "Loan asset pair must be enabled.");
        require(loanAmount > 0, "Invalid loan amount.");
        require(collateralAmount > 0, "Invalid collateral amount.");
        require(_isValidLoanTerm[term], "Invalid loan term.");

        address loaner = msg.sender;
        LoanLocalVars memory localVars;
        localVars.totalCollateralAmount = collateralAmount;
        localVars.remainingCollateralAmount = collateralAmount;

        // Combine freed collateral if needed
        if (useFreedCollateral) {
            uint availableFreedCollateral = _accountManager.decreaseFreedCollateral(collateralAsset, loaner, collateralAmount);
            localVars.remainingCollateralAmount = localVars.remainingCollateralAmount.sub(availableFreedCollateral);
        }

        localVars.collateralAssetPrice = _priceOracle.getPrice(collateralAsset);
        localVars.loanAssetPrice = _priceOracle.getPrice(loanAsset);
        localVars.interestRate = _config.getLoanInterestRate(loanAsset, term);
        localVars.liquidationDiscount = _config.getLiquidationDiscount(loanAsset, collateralAsset);
        localVars.minCollateralRatio = _config.getCollateralRatio(loanAsset, collateralAsset);

        uint interest = loanAmount.mulFixed(localVars.interestRate);

        localVars.currCollateralRatio = localVars.totalCollateralAmount
            .mulFixed(localVars.collateralAssetPrice)
            .divFixed(loanAmount.add(interest))
            .divFixed(localVars.loanAssetPrice);


        require(localVars.currCollateralRatio >= localVars.minCollateralRatio, "Collateral ratio is below requirement.");

        Loan currLoan = new Loan(
            loanAsset,
            collateralAsset,
            loaner,
            term,
            loanAmount,
            localVars.totalCollateralAmount,
            localVars.interestRate,
            localVars.minCollateralRatio,
            localVars.liquidationDiscount
        );

        _numLoans++;

        _loansByUser[loaner].push(currLoan);

        uint[] memory depositTerms = _depositManager.getDepositTerms();

        _liquidityPools.loanFromPoolGroups(currLoan, depositTerms, _loanTerms);

        _tokenManager.receiveFrom(loaner, collateralAsset, localVars.remainingCollateralAmount);
        _tokenManager.sendTo(loaner, loanAsset, loanAmount);

        _accountManager.incrementGeneralStat(loaner, "totalLoans", 1);
        _accountManager.incrementAssetStat(loaner, loanAsset, "totalLoans", 1);
        _accountManager.incrementAssetStat(loaner, loanAsset, "totalLoanAmount", loanAmount);

        emit LoanSuccessful(loaner, currLoan);

        return currLoan;
    }

    function repayLoan(Loan currLoan, uint amount) public whenNotPaused returns (uint) {
        require(_config.isUserActionsLocked() == false, "User actions are locked, please try again later");
        address loanAsset = currLoan.loanAsset();
        address collateralAsset = currLoan.collateralAsset();

        require(_isLoanAssetPairEnabled[loanAsset][collateralAsset], "Loan asset pair must be enabled.");

        address loaner = msg.sender;

        require(loaner == currLoan.owner());

        (uint totalRepayAmount, uint freedCollateralAmount) = currLoan.repay(amount);
        uint[] memory depositTerms = _depositManager.getDepositTerms();

        _liquidityPools.repayLoanToPoolGroups(totalRepayAmount, currLoan, depositTerms, _loanTerms);

        _accountManager.increaseFreedCollateral(collateralAsset, loaner, freedCollateralAmount);

        _tokenManager.receiveFrom(loaner, loanAsset, totalRepayAmount);

        emit RepayLoanSuccessful(loaner, currLoan);

        return totalRepayAmount;
    }

    // A loan can be liquidated when it is defaulted or the collaterization ratio is below requirement
    function liquidateLoan(Loan currLoan, uint amount) external whenNotPaused returns (uint, uint) {
        require(_config.isUserActionsLocked() == false, "User actions are locked, please try again later");
        address loanAsset = currLoan.loanAsset();
        address collateralAsset = currLoan.collateralAsset();

        require(_isLoanAssetPairEnabled[loanAsset][collateralAsset], "Loan asset pair must be enabled.");

        address liquidator = msg.sender;

        require(liquidator != currLoan.owner(), "Loan cannot be liquidated by the owner.");

        uint loanAssetPrice = _priceOracle.getPrice(loanAsset);
        uint collateralAssetPrice = _priceOracle.getPrice(collateralAsset);

        require(
            currLoan.isLiquidatable(loanAssetPrice, collateralAssetPrice),
            "Loan is not liquidatable."
        );

        (uint liquidatedAmount, uint soldCollateralAmount, uint freedCollateralAmount) = currLoan.liquidate(
            amount,
            loanAssetPrice,
            collateralAssetPrice
        );

        uint[] memory depositTerms = _depositManager.getDepositTerms();

        _liquidityPools.repayLoanToPoolGroups(liquidatedAmount, currLoan, depositTerms, _loanTerms);

        _accountManager.increaseFreedCollateral(collateralAsset, currLoan.owner(), freedCollateralAmount);

        if (currLoan.isOverDue()) {
            _accountManager.incrementGeneralStat(currLoan.owner(), "totalDefaults", 1);
        }

        _tokenManager.receiveFrom(liquidator, loanAsset, liquidatedAmount);

        return (liquidatedAmount, soldCollateralAmount);
    }

    function addCollateral(Loan currLoan, uint collateralAmount, bool useFreedCollateral)
        external
        whenNotPaused
        returns (uint)
    {
        require(_config.isUserActionsLocked() == false, "User actions are locked, please try again later");
        require(collateralAmount > 0, "Invalid collateral amount.");

        address loanAsset = currLoan.loanAsset();
        address collateralAsset = currLoan.collateralAsset();

        require(_isLoanAssetPairEnabled[loanAsset][collateralAsset], "Loan asset pair must be enabled.");

        address loaner = msg.sender;

        require(loaner == currLoan.owner(), "Collateral can only be added by owner.");

        uint remainingCollateralAmount = collateralAmount;

        // Combine freed collateral if needed
        if (useFreedCollateral) {
            uint availableFreedCollateral = _accountManager.decreaseFreedCollateral(collateralAsset, loaner, collateralAmount);
            remainingCollateralAmount = remainingCollateralAmount.sub(availableFreedCollateral);
        }

        currLoan.addCollateral(collateralAmount);

        _tokenManager.receiveFrom(loaner, collateralAsset, remainingCollateralAmount);

        emit AddCollateralSuccessful(loaner, currLoan);

        return collateralAmount;
    }

    function isLoanAssetPairEnabled(address loanAsset, address collateralAsset) external whenNotPaused view returns (bool) {
        return _isLoanAssetPairEnabled[loanAsset][collateralAsset];
    }

    function getLoansByUser(address user) external whenNotPaused view returns (Loan[] memory) {
        // We should lock this read action because the loan records will be affecting while the pool group is updating
        require(_config.isUserActionsLocked() == false, "User actions are locked, please try again later");
        return _loansByUser[user];
    }

    function getLoanTerms() external view returns (uint[] memory) {
        return _loanTerms;
    }

    // ADMIN --------------------------------------------------------------

    function init(
        Configuration config,
        PriceOracle priceOracle,
        TokenManager tokenManager,
        LiquidityPools liquidityPools,
        DepositManager depositManager,
        AccountManager accountManager
    )
        public
        whenNotPaused
        onlyOwner
    {
        _config = config;
        _priceOracle = priceOracle;
        _tokenManager = tokenManager;
        _liquidityPools = liquidityPools;
        _depositManager = depositManager;
        _accountManager = accountManager;
    }

    function addLoanTerm(uint loanTerm) public whenNotPaused onlyOwner {
        require(!_isValidLoanTerm[loanTerm], "Term already exists.");

        _loanTerms.push(loanTerm);
        _isValidLoanTerm[loanTerm] = true;

        address[] memory depositAssets = _depositManager.getDepositAssets();
        uint[] memory depositTerms = _depositManager.getDepositTerms();

        // Update totalLoanableAmountPerTerm for each deposit asset and deposit term
        for (uint i = 0; i < depositAssets.length; i++) {
            _liquidityPools.updateTotalLoanableAmountPerTerm(depositAssets[i], depositTerms, loanTerm);
        }
    }

    // Remove a loan term should only affect loan action
    function removeLoanTerm(uint term) external whenNotPaused onlyOwner {
        require(_isValidLoanTerm[term], "Term does not exist.");

        _isValidLoanTerm[term] = false;

        for (uint i = 0; i < _loanTerms.length; i++) {
            if (_loanTerms[i] == term) {
                // Overwrite current term with the last term and shrink array size
                _loanTerms[i] = _loanTerms[_loanTerms.length - 1];
                delete _loanTerms[_loanTerms.length - 1];
                _loanTerms.length--;
            }
        }
    }

    function enableLoanAssetPair(address loanAsset, address collateralAsset) 
        external
        whenNotPaused
        onlyOwner
    {
        require(loanAsset != collateralAsset, "Two assets must be different.");
        require(!_isLoanAssetPairEnabled[loanAsset][collateralAsset], "Loan asset pair is already enabled.");
        _isLoanAssetPairEnabled[loanAsset][collateralAsset] = true;
    }

    function disableLoanAssetPair(address loanAsset, address collateralAsset)
        external
        whenNotPaused
        onlyOwner
    {
        require(_isLoanAssetPairEnabled[loanAsset][collateralAsset], "Loan asset pair is already disabled.");
        _isLoanAssetPairEnabled[loanAsset][collateralAsset] = false;
    }
}
