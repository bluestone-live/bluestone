pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./FixedMath.sol";


contract Loan {
    using SafeMath for uint;
    using FixedMath for uint;

    address private _owner;
    uint8 private _term;
    uint private _loanAmount;
    uint private _collateralAmount;
    uint private _interestRate;
    uint private _minCollateralRatio;
    uint private _liquidationDiscount;
    uint private _accruedInterest;
    uint private _alreadyPaidAmount;
    uint private _liquidatedAmount;
    uint private _soldCollateralAmount;
    uint private _createdAt;
    uint private _lastInterestUpdatedAt;
    uint private _lastRepaidAt;
    uint private _lastLiquidatedAt;
    bool private _isClosed;

    /// Deposit Term -> Pool Index -> Amount
    /// How much have one loaned from a specific pool (identified by Pool Index) 
    /// in a specific pool group (identified by Deposit Term).
    mapping(uint8 => mapping(uint8 => uint)) private records;

    uint constant private DAY_IN_SECONDS = 24 * 60 * 60;
    uint constant private ONE = 10 ** 18;

    constructor(
        address owner, 
        uint8 term, 
        uint loanAmount, 
        uint collateralAmount, 
        uint interestRate, 
        uint minCollateralRatio,
        uint liquidationDiscount
    ) 
        public 
    {
        _owner = owner;
        _term = term;
        _loanAmount = loanAmount;
        _collateralAmount = collateralAmount;
        _interestRate = interestRate;
        _minCollateralRatio = minCollateralRatio;
        _liquidationDiscount = liquidationDiscount;
        _accruedInterest = 0;
        _alreadyPaidAmount = 0;
        _liquidatedAmount = 0;
        _soldCollateralAmount = 0;
        _createdAt = now;
        _lastInterestUpdatedAt = now;
        _lastRepaidAt = 0;
        _lastLiquidatedAt = 0;
        _isClosed = false;
    }

    function setRecord(uint8 depositTerm, uint8 poolIndex, uint amount) external {
        require(amount > 0);

        records[depositTerm][poolIndex] = amount;
    }

    function addCollateral(uint amount) external {
        require(!_isClosed);

        _collateralAmount = _collateralAmount.add(amount);    
    }

    /// @param amount The amount to repay (or -1 for max)
    /// @return repaid amount
    function repay(uint amount) external returns (uint) {
        require(!_isClosed);

        updateAccruedInterest();
        uint currRemainingDebt = remainingDebt();
        uint repaidAmount;

        if (amount == uint(-1)) {
            repaidAmount = currRemainingDebt;
        } else {
            require(amount <= currRemainingDebt);
            repaidAmount = amount;
        }

        _alreadyPaidAmount = _alreadyPaidAmount.add(repaidAmount);

        if (remainingDebt() == 0) {
            _isClosed = true;
        }

        _lastRepaidAt = now;

        return repaidAmount;
    }

    function liquidate(uint requestedAmount, uint loanAssetPrice, uint collateralAssetPrice) 
        external
        returns (uint, uint) 
    {
        require(!_isClosed, "Loan must not be closed.");                        
        require(loanAssetPrice > 0, "Asset price must be greater than 0.");
        require(collateralAssetPrice > 0, "Collateral price must be greater than 0.");

        updateAccruedInterest();
        uint currRemainingDebt = remainingDebt();
        uint liquidatingAmount;

        if (requestedAmount == uint(-1)) {
            liquidatingAmount = currRemainingDebt;
        } else {
            require(
                requestedAmount <= currRemainingDebt, 
                "Requested amount must not be greater than remaining debt."
            );

            liquidatingAmount = requestedAmount;
        }

        uint soldCollateralAmount = liquidatingAmount
            .mulFixed(loanAssetPrice)
            .divFixed(collateralAssetPrice)
            .divFixed(ONE.sub(_liquidationDiscount));

        _soldCollateralAmount = _soldCollateralAmount.add(soldCollateralAmount);
        _liquidatedAmount = _liquidatedAmount.add(liquidatingAmount);

        if (remainingDebt() == 0) {
            _isClosed = true;
        }

        _lastLiquidatedAt = now;

        return (liquidatingAmount, soldCollateralAmount);
    }

    function owner() external view returns (address) {
        return _owner;
    }

    function term() external view returns (uint8) {
        return _term;
    }

    function loanAmount() external view returns (uint) {
        return _loanAmount;
    }

    function alreadyPaidAmount() external view returns (uint) {
        return _alreadyPaidAmount;
    }

    function liquidatedAmount() external view returns (uint) {
        return _liquidatedAmount;
    }

    function soldCollateralAmount() external view returns (uint) {
        return _soldCollateralAmount;
    }

    function getRecord(uint8 depositTerm, uint8 poolIndex) external view returns (uint) {
        return records[depositTerm][poolIndex];
    }

    function isClosed() external view returns (bool) {
        return _isClosed;
    }

    function isLiquidatable(uint loanAssetPrice, uint collateralAssetPrice) external returns (bool) {
        updateAccruedInterest();

        uint currCollateralRatio = _collateralAmount.sub(_soldCollateralAmount)
            .mulFixed(collateralAssetPrice)
            .divFixed(remainingDebt())
            .divFixed(loanAssetPrice);

        bool isUnderCollateralized = currCollateralRatio < _minCollateralRatio;
        bool isOverDue = now > _createdAt + _term * DAY_IN_SECONDS;

        return isUnderCollateralized || isOverDue;
    }

    /// The latest accured interest is calculated upon query
    function accruedInterest() public view returns (uint) {
        uint prevRemainingDebt = remainingDebt();
        uint newInterest = prevRemainingDebt.mulFixed(_interestRate.mul(now - _lastInterestUpdatedAt));
        return _accruedInterest.add(newInterest);
    }

    function remainingDebt() public view returns (uint) {
        return _loanAmount.add(_accruedInterest).sub(_alreadyPaidAmount).sub(_liquidatedAmount);
    }

    function updateAccruedInterest() private {
        _accruedInterest = accruedInterest();
        _lastInterestUpdatedAt = now;
    }
}
