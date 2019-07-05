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

    /// loan asset -> collateral asset -> enabled
    /// An loan asset pair refers to loan token A using collateral B, i.e., "B -> A",
    /// Loan-related transactions can happen only if "B -> A" is enabled. 
    mapping(address => mapping(address => bool)) private _isLoanAssetPairEnabled;

    // loan ID -> Loan
    mapping(bytes32 => Loan) private _loans;

    // User address -> A list of loan IDs
    mapping(address => bytes32[]) private _loanIdsByUser;

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

    constructor(address config, address priceOracle, address tokenManager, address liquidityPools, address depositManager) public {
        _config = Configuration(config);
        _priceOracle = PriceOracle(priceOracle);
        _tokenManager = TokenManager(tokenManager);
        _liquidityPools = LiquidityPools(liquidityPools);
        _depositManager = DepositManager(depositManager);
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
        returns (bytes32)
    {
        require(_isLoanAssetPairEnabled[loanAsset][collateralAsset], "Loan asset pair must be enabled.");
        require(loanAmount > 0, "Invalid loan amount.");
        require(collateralAmount > 0 || requestedFreedCollateral > 0, "Invalid collateral amount.");

        address loaner = msg.sender;
        LoanLocalVars memory localVars;
        localVars.totalCollateralAmount = collateralAmount;

        // Combine freed collateral if needed
        if (requestedFreedCollateral > 0) {
            uint availableFreedCollateral = _freedCollaterals[loaner][collateralAsset];

            require(requestedFreedCollateral <= availableFreedCollateral, "Not enough freed collateral.");

            _freedCollaterals[loaner][collateralAsset] = availableFreedCollateral.sub(requestedFreedCollateral);
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

        _numLoans++;

        bytes32 loanId = keccak256(abi.encode(_numLoans));

        _loans[loanId] = new Loan(
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

        _loanIdsByUser[loaner].push(loanId);

        _loanFromPoolGroups(loanAsset, term, loanAmount, loanId);        

        _tokenManager.receiveFrom(loaner, collateralAsset, collateralAmount);
        _tokenManager.sendTo(loaner, loanAsset, loanAmount);

        return loanId;
    }

    function repayLoan(bytes32 loanId, uint amount) external whenNotPaused returns (uint) {
        Loan currLoan = _loans[loanId];
        address loanAsset = currLoan.loanAsset();
        address collateralAsset = currLoan.collateralAsset();

        require(_isLoanAssetPairEnabled[loanAsset][collateralAsset], "Loan asset pair must be enabled.");

        address loaner = msg.sender;

        require(loaner == currLoan.owner());

        (uint totalRepayAmount, uint freedCollateralAmount) = currLoan.repay(amount);

        _repayLoanToPoolGroups(loanAsset, totalRepayAmount, loanId);

        _depositFreedCollateral(loaner, collateralAsset, freedCollateralAmount);

        _tokenManager.receiveFrom(loaner, loanAsset, totalRepayAmount);

        return totalRepayAmount;
    }

    // A loan can be liquidated when it is defaulted or the collaterization ratio is below requirement
    function liquidateLoan(bytes32 loanId, uint amount) external whenNotPaused returns (uint, uint) {
        Loan currLoan = _loans[loanId];
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

        _repayLoanToPoolGroups(loanAsset, liquidatedAmount, loanId);

        _depositFreedCollateral(liquidator, collateralAsset, freedCollateralAmount);

        _tokenManager.receiveFrom(liquidator, loanAsset, liquidatedAmount);

        return (liquidatedAmount, soldCollateralAmount);
    }

    function withdrawFreedCollateral(address asset, uint amount) external whenNotPaused {
        require(amount > 0, "Withdraw amount must be greater than 0.");

        address user = msg.sender;
        uint availableToWithdraw = _freedCollaterals[user][asset];

        require(amount <= availableToWithdraw, "Not enough freed collateral to withdraw.");

        _freedCollaterals[user][asset] = availableToWithdraw.sub(amount);

        _tokenManager.sendTo(user, asset, amount);
    }

    function getFreedCollateral(address asset) external whenNotPaused view returns (uint) {
        return _freedCollaterals[msg.sender][asset];
    }

    function isLoanAssetPairEnabled(address loanAsset, address collateralAsset) external whenNotPaused view returns (bool) {
        return _isLoanAssetPairEnabled[loanAsset][collateralAsset];
    }

    function getLoanIdsByUser(address user) external whenNotPaused view returns (bytes32[] memory) {
        return _loanIdsByUser[user];
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

    // PRIVATE --------------------------------------------------------------

    function _loanFromPoolGroups(address loanAsset, uint8 loanTerm, uint loanAmount, bytes32 loanId) private {
        if (loanTerm == 1) {
            _loanFromPoolGroup(loanAsset, 1, loanTerm, loanAmount, loanId);
            _loanFromPoolGroup(loanAsset, 7, loanTerm, loanAmount, loanId);
            _loanFromPoolGroup(loanAsset, 30, loanTerm, loanAmount, loanId);
        } else if (loanTerm == 3 || loanTerm == 7) {
            _loanFromPoolGroup(loanAsset, 7, loanTerm, loanAmount, loanId);
            _loanFromPoolGroup(loanAsset, 30, loanTerm, loanAmount, loanId);
        } else if (loanTerm == 30) {
            _loanFromPoolGroup(loanAsset, 30, loanTerm, loanAmount, loanId);
        }
    }

    function _loanFromPoolGroup(address asset, uint8 depositTerm, uint8 loanTerm, uint loanAmount, bytes32 loanId) private {
        PoolGroup poolGroup = _liquidityPools.poolGroups(asset, depositTerm);
        uint coefficient = _config.getCoefficient(asset, depositTerm, loanTerm);
            
        // Calculate the total amount to be loaned from this pool group 
        uint remainingLoanAmount = coefficient.mulFixed(loanAmount);

        /// Assuming the calculated loan amount is always not more than the amount the 
        /// pool group can provide. TODO: add a check here just in case.

        uint8 poolIndex = loanTerm - 1;
        uint8 poolGroupLength = depositTerm;

        // Incrementing the pool group index and loaning from each pool until loan amount is fulfilled.
        while (remainingLoanAmount > 0 && poolIndex < poolGroupLength) {
            uint loanableAmount = poolGroup.getLoanableAmountFromPool(poolIndex);

            if (loanableAmount > 0) {
                uint loanedAmount = Math.min(remainingLoanAmount, loanableAmount);

                poolGroup.loanFromPool(poolIndex, loanedAmount, loanTerm);
                _loans[loanId].setRecord(depositTerm, poolIndex, loanedAmount);
                remainingLoanAmount = remainingLoanAmount.sub(loanedAmount);
            }

            poolIndex++;
        }

        /// Loan amount affects deposit interest rate, so we need to update 
        /// deposit interest index and interest rate 
        _depositManager.updateDepositAssetInterestInfo(asset, depositTerm);
    }

    function _repayLoanToPoolGroups(address asset, uint totalRepayAmount, bytes32 loanId) private {
        _repayLoanToPoolGroup(asset, 30, totalRepayAmount, loanId);
        _repayLoanToPoolGroup(asset, 7, totalRepayAmount, loanId);
        _repayLoanToPoolGroup(asset, 1, totalRepayAmount, loanId);
    }

    function _repayLoanToPoolGroup(address asset, uint8 depositTerm, uint totalRepayAmount, bytes32 loanId) 
        private returns (uint) 
    {
        PoolGroup poolGroup = _liquidityPools.poolGroups(asset, depositTerm);
        Loan currLoan = _loans[loanId];

        uint totalLoanAmount = currLoan.loanAmount();

        // Repay loan back to each pool, proportional to the total loan from all pools
        for (uint8 poolIndex = 0; poolIndex < depositTerm; poolIndex++) {
            uint loanAmount = currLoan.getRecord(depositTerm, poolIndex);

            if (loanAmount == 0) {
                // Skip this pool since it has no loan
                continue;
            }

            /// Calculate the amount to repay to this pool, e.g., if I loaned total of 100
            /// from all pools, where 10 is from this pool, and I want to repay 50 now.
            /// Then the amount pay back to this pool will be: 50 * 10 / 100 = 5
            uint repayAmount = totalRepayAmount.mulFixed(loanAmount).divFixed(totalLoanAmount);
            poolGroup.repayLoanToPool(poolIndex, repayAmount, currLoan.term());
        }

        /// Loan amount affects deposit interest rate, so we need to update 
        /// deposit interest index and interest rate 
        _depositManager.updateDepositAssetInterestInfo(asset, depositTerm);
    }
}
