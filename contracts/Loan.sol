pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/math/Math.sol';
import './FixedMath.sol';

contract Loan {
    using SafeMath for uint256;
    using FixedMath for uint256;

    address private _loanAsset;
    address private _collateralAsset;
    address private _owner;
    uint256 private _term;
    uint256 private _loanAmount;
    uint256 private _collateralAmount;
    uint256 private _annualInterestRate;
    uint256 private _interest;
    uint256 private _minCollateralRatio;
    uint256 private _liquidationDiscount;
    uint256 private _alreadyPaidAmount;
    uint256 private _liquidatedAmount;
    uint256 private _soldCollateralAmount;
    uint256 private _createdAt;
    uint256 private _lastInterestUpdatedAt;
    uint256 private _lastRepaidAt;
    uint256 private _lastLiquidatedAt;
    bool private _isClosed;

    /// Deposit Term -> Pool ID -> Amount
    /// How much have one loaned from a specific pool (identified by Pool Index)
    /// in a specific pool group (identified by Deposit Term).
    mapping(uint256 => mapping(uint256 => uint256)) private _records;

    uint256 private constant DAY_IN_SECONDS = 24 * 60 * 60;
    uint256 private constant ONE = 10**18;

    constructor(
        address loanAsset,
        address collateralAsset,
        address owner,
        uint256 term,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 annualInterestRate,
        uint256 minCollateralRatio,
        uint256 liquidationDiscount
    ) public {
        _loanAsset = loanAsset;
        _collateralAsset = collateralAsset;
        _owner = owner;
        _term = term;
        _loanAmount = loanAmount;
        _collateralAmount = collateralAmount;
        _annualInterestRate = annualInterestRate;

        // calculate simple interest
        _interest = loanAmount.mulFixed(annualInterestRate).mul(term).div(365);

        _minCollateralRatio = minCollateralRatio;
        _liquidationDiscount = liquidationDiscount;
        _alreadyPaidAmount = 0;
        _liquidatedAmount = 0;
        _soldCollateralAmount = 0;
        _createdAt = now;
        _lastInterestUpdatedAt = now;
        _lastRepaidAt = 0;
        _lastLiquidatedAt = 0;
        _isClosed = false;
    }

    function setRecord(uint256 depositTerm, uint256 poolId, uint256 amount)
        external
    {
        require(amount > 0);

        _records[depositTerm][poolId] = amount;
    }

    function addCollateral(uint256 amount) external {
        require(!_isClosed);

        _collateralAmount = _collateralAmount.add(amount);
    }

    /// @param amount The amount to repay
    /// @return (repaidAmount, freedCollateralAmount)
    function repay(uint256 amount) external returns (uint256, uint256) {
        require(!_isClosed, 'Loan must not be closed.');

        uint256 currRemainingDebt = remainingDebt();

        require(amount <= currRemainingDebt, 'Invalid repay amount.');

        _alreadyPaidAmount = _alreadyPaidAmount.add(amount);
        _lastRepaidAt = now;

        if (remainingDebt() == 0) {
            _isClosed = true;

            uint256 freedCollateralAmount = _collateralAmount.sub(
                _soldCollateralAmount
            );
            return (amount, freedCollateralAmount);
        } else {
            return (amount, 0);
        }
    }

    function liquidate(
        uint256 amount,
        uint256 loanAssetPrice,
        uint256 collateralAssetPrice
    ) external returns (uint256, uint256, uint256) {
        require(!_isClosed, 'Loan must not be closed.');
        require(loanAssetPrice > 0, 'Asset price must be greater than 0.');
        require(
            collateralAssetPrice > 0,
            'Collateral price must be greater than 0.'
        );

        uint256 currRemainingDebt = remainingDebt();
        uint256 liquidatingAmount = Math.min(amount, currRemainingDebt);

        uint256 soldCollateralAmount = liquidatingAmount
            .mulFixed(loanAssetPrice)
            .divFixed(collateralAssetPrice)
            .divFixed(ONE.sub(_liquidationDiscount));

        _soldCollateralAmount = _soldCollateralAmount.add(soldCollateralAmount);
        _liquidatedAmount = _liquidatedAmount.add(liquidatingAmount);
        _lastLiquidatedAt = now;

        if (remainingDebt() == 0) {
            // Close the loan if debt is clear
            _isClosed = true;

            // Release the collateral
            uint256 freedCollateralAmount = _collateralAmount.sub(
                _soldCollateralAmount
            );
            return (
                liquidatingAmount,
                soldCollateralAmount,
                freedCollateralAmount
            );
        } else {
            // Still has remaining debt, do not release the collateral
            return (liquidatingAmount, soldCollateralAmount, 0);
        }
    }

    function loanAsset() external view returns (address) {
        return _loanAsset;
    }

    function collateralAsset() external view returns (address) {
        return _collateralAsset;
    }

    function owner() external view returns (address) {
        return _owner;
    }

    function term() external view returns (uint256) {
        return _term;
    }

    function loanAmount() external view returns (uint256) {
        return _loanAmount;
    }

    function alreadyPaidAmount() external view returns (uint256) {
        return _alreadyPaidAmount;
    }

    function liquidatedAmount() external view returns (uint256) {
        return _liquidatedAmount;
    }

    function collateralAmount() external view returns (uint256) {
        return _collateralAmount;
    }

    function soldCollateralAmount() external view returns (uint256) {
        return _soldCollateralAmount;
    }

    function annualInterestRate() external view returns (uint256) {
        return _annualInterestRate;
    }

    function interest() external view returns (uint256) {
        return _interest;
    }

    function getRecord(uint256 depositTerm, uint256 poolId)
        external
        view
        returns (uint256)
    {
        return _records[depositTerm][poolId];
    }

    function isClosed() external view returns (bool) {
        return _isClosed;
    }

    function createdAt() external view returns (uint256) {
        return _createdAt;
    }

    function isOverDue() public view returns (bool) {
        return now > _createdAt + _term * DAY_IN_SECONDS;
    }

    // Check whether the loan is defaulted or under the required collaterization ratio
    function isLiquidatable(
        uint256 loanAssetPrice,
        uint256 collateralAssetPrice
    ) external view returns (bool) {
        if (_isClosed) {
            return false;
        }

        uint256 currCollateralRatio = _collateralAmount
            .sub(_soldCollateralAmount)
            .mulFixed(collateralAssetPrice)
            .divFixed(remainingDebt())
            .divFixed(loanAssetPrice);

        bool isUnderCollateralized = currCollateralRatio < _minCollateralRatio;

        return isUnderCollateralized || isOverDue();
    }

    // The remaining debt equals to orignal loan + interest - repaid loan - liquidated loan.
    function remainingDebt() public view returns (uint256) {
        return
            _loanAmount.add(_interest).sub(_alreadyPaidAmount).sub(
                _liquidatedAmount
            );
    }
}
