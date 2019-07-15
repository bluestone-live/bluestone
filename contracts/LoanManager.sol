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
import "./PoolGroup.sol";
import "./FixedMath.sol";
import "./Loan.sol";
import "./Term.sol";


// The main contract which handles everything related to loan.
contract LoanManager is Ownable, Pausable, Term {
    using SafeERC20 for ERC20;
    using SafeMath for uint;
    using FixedMath for uint;

    Configuration private _config;
    PriceOracle private _priceOracle;
    TokenManager private _tokenManager;
    LiquidityPools private _liquidityPools;
    DepositManager private _depositManager;

    event LoanSuccessful(address indexed user, Loan loan);
    event RepayLoanSuccessful(address indexed user, Loan loan);
    event AddCollateralSuccessful(address indexed user, Loan loan);
    event WithdrawFreeCollateralSuccessful(address indexed user);

    /// loan asset -> collateral asset -> enabled
    /// An loan asset pair refers to loan token A using collateral B, i.e., "B -> A",
    /// Loan-related transactions can happen only if "B -> A" is enabled. 
    mapping(address => mapping(address => bool)) private _isLoanAssetPairEnabled;

    // User address -> A list of Loans
    mapping(address => Loan[]) private _loansByUser;

    uint private _numLoans;

    /// user -> asset -> freed collateral
    /// When a loan has been repaid and liquidated, the remaining collaterals
    /// becomes "free" and can be withdrawn or be used for new loan
    mapping(address => mapping(address => uint)) private _freedCollaterals;

    /// This struct is used internally in the `loan` function to avoid
    /// "CompilerError: Stack too deep, try removing local variables"
    struct LoanLocalVars {
        uint totalCollateralAmount;
        uint loanAssetPrice;
        uint collateralAssetPrice;
        uint currCollateralRatio;
        uint minCollateralRatio;
        uint interestRate;
        uint liquidationDiscount;
    }

    constructor(
        Configuration config, 
        PriceOracle priceOracle, 
        TokenManager tokenManager, 
        LiquidityPools liquidityPools, 
        DepositManager depositManager
    ) 
        public 
    {
        _config = config;
        _priceOracle = priceOracle;
        _tokenManager = tokenManager;
        _liquidityPools = liquidityPools;
        _depositManager = depositManager;
    }

    // PUBLIC  -----------------------------------------------------------------

    function loan(
        uint8 term,
        address loanAsset,
        address collateralAsset,
        uint loanAmount,
        uint collateralAmount,
        uint requestedFreedCollateral
    ) 
        public 
        whenNotPaused
        validLoanTerm(term)
        returns (Loan)
    {
        require(_isLoanAssetPairEnabled[loanAsset][collateralAsset], "Loan asset pair must be enabled.");
        require(loanAmount > 0, "Invalid loan amount.");
        require(collateralAmount > 0 || requestedFreedCollateral > 0, "Invalid collateral amount.");

        address loaner = msg.sender;
        LoanLocalVars memory localVars;
        localVars.totalCollateralAmount = collateralAmount;

        // Combine freed collateral if needed
        if (requestedFreedCollateral > 0) {
            _withdrawFreedCollateral(loaner, collateralAsset, requestedFreedCollateral);
            localVars.totalCollateralAmount = localVars.totalCollateralAmount.add(requestedFreedCollateral);
        } 

        localVars.collateralAssetPrice = _priceOracle.getPrice(collateralAsset);
        localVars.loanAssetPrice = _priceOracle.getPrice(loanAsset);

        localVars.currCollateralRatio = localVars.totalCollateralAmount
            .mulFixed(localVars.collateralAssetPrice)
            .divFixed(loanAmount)
            .divFixed(localVars.loanAssetPrice);

        localVars.minCollateralRatio = _config.getCollateralRatio(loanAsset, collateralAsset);

        require(localVars.currCollateralRatio >= localVars.minCollateralRatio, "Collateral ratio is below requirement.");

        localVars.interestRate = _config.getLoanInterestRate(loanAsset, term);
        localVars.liquidationDiscount = _config.getLiquidationDiscount(loanAsset, collateralAsset);

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

        _loanFromPoolGroups(loanAsset, term, loanAmount, currLoan);        

        _tokenManager.receiveFrom(loaner, collateralAsset, collateralAmount);
        _tokenManager.sendTo(loaner, loanAsset, loanAmount);

        emit LoanSuccessful(loaner, currLoan);

        return currLoan;
    }

    function repayLoan(Loan currLoan, uint amount) external whenNotPaused returns (uint) {
        address loanAsset = currLoan.loanAsset();
        address collateralAsset = currLoan.collateralAsset();

        require(_isLoanAssetPairEnabled[loanAsset][collateralAsset], "Loan asset pair must be enabled.");

        address loaner = msg.sender;

        require(loaner == currLoan.owner());

        (uint totalRepayAmount, uint freedCollateralAmount) = currLoan.repay(amount);

        _repayLoanToPoolGroups(loanAsset, totalRepayAmount, currLoan);

        _depositFreedCollateral(loaner, collateralAsset, freedCollateralAmount);

        _tokenManager.receiveFrom(loaner, loanAsset, totalRepayAmount);

        emit RepayLoanSuccessful(loaner, currLoan);

        return totalRepayAmount;
    }

    // A loan can be liquidated when it is defaulted or the collaterization ratio is below requirement
    function liquidateLoan(Loan currLoan, uint amount) external whenNotPaused returns (uint, uint) {
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

        _repayLoanToPoolGroups(loanAsset, liquidatedAmount, currLoan);

        _depositFreedCollateral(liquidator, collateralAsset, freedCollateralAmount);

        _tokenManager.receiveFrom(liquidator, loanAsset, liquidatedAmount);

        return (liquidatedAmount, soldCollateralAmount);
    }

    function addCollateral(Loan currLoan, uint collateralAmount, uint requestedFreedCollateral) 
        external 
        whenNotPaused 
        returns (uint) 
    {
        require(collateralAmount > 0 || requestedFreedCollateral > 0, "Invalid collateral amount.");

        address loanAsset = currLoan.loanAsset();
        address collateralAsset = currLoan.collateralAsset();

        require(_isLoanAssetPairEnabled[loanAsset][collateralAsset], "Loan asset pair must be enabled.");

        address loaner = msg.sender;

        require(loaner == currLoan.owner(), "Collateral can only be added by owner.");

        uint totalCollateralAmount = collateralAmount;

        // Combine freed collateral if needed
        if (requestedFreedCollateral > 0) {
            _withdrawFreedCollateral(loaner, collateralAsset, requestedFreedCollateral);
            totalCollateralAmount = totalCollateralAmount.add(requestedFreedCollateral);
        } 

        currLoan.addCollateral(totalCollateralAmount); 

        _tokenManager.receiveFrom(loaner, collateralAsset, totalCollateralAmount);

        emit AddCollateralSuccessful(loaner, currLoan);

        return totalCollateralAmount;
    }

    function withdrawFreedCollateral(address asset, uint amount) external whenNotPaused {
        address user = msg.sender;
        _withdrawFreedCollateral(user, asset, amount);
        _tokenManager.sendTo(user, asset, amount);
        emit WithdrawFreeCollateralSuccessful(user);
    }

    function getFreedCollateral(address asset) external whenNotPaused view returns (uint) {
        return _freedCollaterals[msg.sender][asset];
    }

    function isLoanAssetPairEnabled(address loanAsset, address collateralAsset) external whenNotPaused view returns (bool) {
        return _isLoanAssetPairEnabled[loanAsset][collateralAsset];
    }

    function getLoansByUser(address user) external whenNotPaused view returns (Loan[] memory) {
        return _loansByUser[user];
    }

    // ADMIN --------------------------------------------------------------

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

    // INTERNAL --------------------------------------------------------------

    function _depositFreedCollateral(address user, address asset, uint amount) internal {
        _freedCollaterals[user][asset] = _freedCollaterals[user][asset].add(amount);
    }

    function _withdrawFreedCollateral(address user, address asset, uint amount) internal {
        require(amount > 0, "Freed collateral amount must be greater than 0.");

        uint availableFreedCollateral = _freedCollaterals[user][asset];

        require(amount <= availableFreedCollateral, "Not enough freed collateral.");

        _freedCollaterals[user][asset] = availableFreedCollateral.sub(amount);
    }

    // PRIVATE --------------------------------------------------------------

    function _loanFromPoolGroups(address loanAsset, uint8 loanTerm, uint loanAmount, Loan currLoan) private {
        if (loanTerm == 1) {
            _loanFromPoolGroup(loanAsset, 1, loanTerm, loanAmount, currLoan);
            _loanFromPoolGroup(loanAsset, 30, loanTerm, loanAmount, currLoan);
        }  else if (loanTerm == 30) {
            _loanFromPoolGroup(loanAsset, 30, loanTerm, loanAmount, currLoan);
        }
    }

    function _loanFromPoolGroup(
        address asset,
        uint8 depositTerm,
        uint8 loanTerm,
        uint loanAmount,
        Loan currLoan
    ) 
        private 
    {
        _liquidityPools.loanFromPoolGroup(asset, depositTerm, loanTerm, loanAmount, currLoan);

        /// Loan amount affects deposit interest rate, so we need to update 
        /// deposit interest index and interest rate 
        _depositManager.updateDepositAssetInterestInfo(asset, depositTerm);
    }

    function _repayLoanToPoolGroups(address asset, uint totalRepayAmount, Loan currLoan) private {
        _repayLoanToPoolGroup(asset, 30, totalRepayAmount, currLoan);
        _repayLoanToPoolGroup(asset, 1, totalRepayAmount, currLoan);
    }

    function _repayLoanToPoolGroup(address asset, uint8 depositTerm, uint totalRepayAmount, Loan currLoan) private {
        _liquidityPools.repayLoanToPoolGroup(asset, depositTerm, totalRepayAmount, currLoan);

        /// Loan amount affects deposit interest rate, so we need to update 
        /// deposit interest index and interest rate 
        _depositManager.updateDepositAssetInterestInfo(asset, depositTerm);
    }
}
