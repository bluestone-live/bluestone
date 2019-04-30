pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
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


contract LoanManager is Ownable, Term {
    using SafeERC20 for ERC20;
    using SafeMath for uint;
    using FixedMath for uint;

    Configuration private _config;
    PriceOracle private _priceOracle;
    TokenManager private _tokenManager;
    LiquidityPools private _liquidityPools;
    DepositManager private _depositManager;

    // loan asset -> collateral asset -> enabled
    mapping(address => mapping(address => bool)) private _isLoanAssetPairEnabled;
    mapping(uint => Loan) private _loans;
    uint private _loanId;

    // user -> asset -> freed collateral
    mapping(address => mapping(address => uint)) private _freedCollaterals;

    modifier enabledLoanAssetPair(address loanAsset, address collateralAsset) {
        require (_isLoanAssetPairEnabled[loanAsset][collateralAsset]);
        _;
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
        external 
        validLoanTerm(term)
        enabledLoanAssetPair(loanAsset, collateralAsset)
    {
        require(loanAmount > 0);
        require(collateralAmount > 0 || requestedFreedCollateral > 0);

        uint availableFreedCollateral = _freedCollaterals[msg.sender][collateralAsset];

        require(requestedFreedCollateral <= availableFreedCollateral, "Not enough freed collateral.");

        _freedCollaterals[msg.sender][collateralAsset] = availableFreedCollateral.sub(requestedFreedCollateral);
        uint totalCollateralAmount = collateralAmount.add(requestedFreedCollateral);
        
        _ensureCollateralRatio(
            collateralAsset, 
            loanAsset,
            totalCollateralAmount,
            loanAmount
        );

        uint interestRate = _config.getLoanInterestRate(term);
        uint minCollateralRatio = _config.getCollateralRatio(loanAsset, collateralAsset);
        uint liquidationDiscount = _config.getLiquidationDiscount(loanAsset, collateralAsset);

        _loans[_loanId] = new Loan(
            msg.sender, 
            term, 
            loanAmount, 
            totalCollateralAmount, 
            interestRate,
            minCollateralRatio, 
            liquidationDiscount
        );

        _loanFromPoolGroups(loanAsset, term, loanAmount, _loanId);        

        _loanId++;

        // TODO: balance transfer
    }

    function repayLoan(address loanAsset, address collateralAsset, uint loanId, uint amount) 
        external 
        enabledLoanAssetPair(loanAsset, collateralAsset)
        returns (uint)
    {
        address user = msg.sender;
        Loan currLoan = _loans[loanId];

        require(user == currLoan.owner());

        (uint totalRepayAmount, uint freedCollateralAmount) = currLoan.repay(amount);

        _repayLoanToPoolGroups(loanAsset, totalRepayAmount, loanId);

        // TODO: balance transfer

        _depositFreedCollateral(user, collateralAsset, freedCollateralAmount);

        return totalRepayAmount;
    }

    function liquidateLoan(address loanAsset, address collateralAsset, uint loanId, uint amount) 
        external 
        enabledLoanAssetPair(loanAsset, collateralAsset)
        returns (uint, uint)
    {
        address liquidator = msg.sender;
        Loan currLoan = _loans[loanId];

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

        // TODO: balance transfer

        _depositFreedCollateral(liquidator, collateralAsset, freedCollateralAmount);

        return (liquidatedAmount, soldCollateralAmount);
    }

    function withdrawFreedCollateral(address asset, uint amount) external {
        require(amount > 0, "Withdraw amount must be greater than 0.");

        address user = msg.sender;
        uint availableToWithdraw = _freedCollaterals[user][asset];

        require(amount <= availableToWithdraw, "Not enough freed collateral to withdraw.");

        _freedCollaterals[user][asset] = availableToWithdraw.sub(amount);

        _tokenManager.sendTo(user, asset, amount);
    }

    function getFreedCollateral(address asset) external view returns (uint) {
        return _freedCollaterals[msg.sender][asset];
    }

    // ADMIN --------------------------------------------------------------

    function enableLoanAssetPair(address loanAsset, address collateralAsset) 
        external 
        onlyOwner 
    {
        _isLoanAssetPairEnabled[loanAsset][collateralAsset] = true;
    }

    function disableLoanAssetPair(address loanAsset, address collateralAsset) 
        external 
        onlyOwner 
        enabledLoanAssetPair(loanAsset, collateralAsset)
    {
        _isLoanAssetPairEnabled[loanAsset][collateralAsset] = false;
    }

    // INTERNAL --------------------------------------------------------------

    function _depositFreedCollateral(address user, address asset, uint amount) internal {
        _freedCollaterals[user][asset] = _freedCollaterals[user][asset].add(amount);
    }

    // PRIVATE --------------------------------------------------------------

    function _ensureCollateralRatio(
        address collateralAsset, 
        address loanAsset,
        uint collateralAmount, 
        uint loanAmount
    ) 
        private
        view
    {
        uint collateralAssetPrice = _priceOracle.getPrice(collateralAsset);
        uint loanAssetPrice = _priceOracle.getPrice(loanAsset);

        uint currCollateralRatio = collateralAmount
            .mulFixed(collateralAssetPrice)
            .divFixed(loanAmount)
            .divFixed(loanAssetPrice);

        uint minCollateralRatio = _config.getCollateralRatio(loanAsset, collateralAsset);

        require(currCollateralRatio >= minCollateralRatio, "Collateral ratio is below requirement.");
    }

    function _loanFromPoolGroups(address loanAsset, uint8 loanTerm, uint loanAmount, uint loanId) private {
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

    function _loanFromPoolGroup(address asset, uint8 depositTerm, uint8 loanTerm, uint loanAmount, uint loanId) private {
        PoolGroup poolGroup = _liquidityPools.poolGroups(asset, depositTerm);
        uint coefficient = _config.getCoefficient(depositTerm, loanTerm);
            
        // Calculate the total amount to be loaned from this pool group 
        uint remainingLoanAmount = coefficient.mulFixed(loanAmount);

        /// Assuming the calculated loan amount is always not more than the amount the 
        /// pool group can provide. TODO: add a check here just in case.

        uint8 poolIndex = loanTerm - 1;
        uint8 poolGroupLength = depositTerm;

        /// Incrementing the pool group index and loaning from each pool until loan amount is fulfilled.
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

        _depositManager.updateDepositAssetInterestInfo(asset, depositTerm);
    }

    function _repayLoanToPoolGroups(address asset, uint totalRepayAmount, uint loanId) private {
        _repayLoanToPoolGroup(asset, 30, totalRepayAmount, loanId);
        _repayLoanToPoolGroup(asset, 7, totalRepayAmount, loanId);
        _repayLoanToPoolGroup(asset, 1, totalRepayAmount, loanId);
    }

    function _repayLoanToPoolGroup(address asset, uint8 depositTerm, uint totalRepayAmount, uint loanId) 
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

        _depositManager.updateDepositAssetInterestInfo(asset, depositTerm);
    }
}
