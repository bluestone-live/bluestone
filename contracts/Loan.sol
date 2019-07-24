pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./FixedMath.sol";


contract Loan {
    using SafeMath for uint;
    using FixedMath for uint;

    address private _loanAsset;
    address private _collateralAsset;
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
    mapping(uint8 => mapping(uint8 => uint)) private _records;

    uint constant private DAY_IN_SECONDS = 24 * 60 * 60;
    uint constant private ONE = 10 ** 18;

    constructor(
        address loanAsset,
        address collateralAsset,
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
        _loanAsset = loanAsset;
        _collateralAsset = collateralAsset;
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

        _records[depositTerm][poolIndex] = amount;
    }

    function addCollateral(uint amount) external {
        require(!_isClosed);

        _collateralAmount = _collateralAmount.add(amount);    
    }

    /// @param amount The amount to repay (or -1 for max)
    /// @return (repaidAmount, freedCollateralAmount)
    function repay(uint amount) external returns (uint, uint) {
        require(!_isClosed);

        updateAccruedInterest();
        uint currRemainingDebt = remainingDebt();
        uint repaidAmount;

        // uint -1 will be 2^53-1, It's can be used here but I'm afraid it's not a good practice.
        if (amount == uint(-1)) {
            repaidAmount = currRemainingDebt;
        } else {
            require(amount <= currRemainingDebt);
            repaidAmount = amount;
        }

        _alreadyPaidAmount = _alreadyPaidAmount.add(repaidAmount);
        _lastRepaidAt = now;

        if (remainingDebt() == 0) {
            _isClosed = true;

            uint freedCollateralAmount = _collateralAmount.sub(_soldCollateralAmount);
            return (repaidAmount, freedCollateralAmount);
        } else {
            return (repaidAmount, 0);
        }
    }

    function liquidate(uint requestedAmount, uint loanAssetPrice, uint collateralAssetPrice) 
        external
        returns (uint, uint, uint)
    {
        require(!_isClosed, "Loan must not be closed.");                        
        require(loanAssetPrice > 0, "Asset price must be greater than 0.");
        require(collateralAssetPrice > 0, "Collateral price must be greater than 0.");

        updateAccruedInterest();
        uint currRemainingDebt = remainingDebt();
        uint liquidatingAmount;

        if (requestedAmount == uint(-1)) {
            // Liquidate the full remaining debt
            liquidatingAmount = currRemainingDebt;
        } else {
            // Liquidate a partial of remaining debt

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
        _lastLiquidatedAt = now;

        if (remainingDebt() == 0) {
            // Close the loan if debt is clear
            _isClosed = true;

            // Release the collateral
            uint freedCollateralAmount = _collateralAmount.sub(_soldCollateralAmount);
            return (liquidatingAmount, soldCollateralAmount, freedCollateralAmount);
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

    function collateralAmount() external view returns (uint) {
        return _collateralAmount;
    }

    function soldCollateralAmount() external view returns (uint) {
        return _soldCollateralAmount;
    }

    function getRecord(uint8 depositTerm, uint8 poolIndex) external view returns (uint) {
        return _records[depositTerm][poolIndex];
    }

    function isClosed() external view returns (bool) {
        return _isClosed;
    }

    function createdAt() external view returns (uint) {
        return _createdAt;
    }

    // Check whether the loan is defaulted or under the required collaterization ratio
    function isLiquidatable(uint loanAssetPrice, uint collateralAssetPrice) external returns (bool) {
        if (_isClosed) {
            return false;
        }
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

    // The remaining debt equals to orignal loan + accrued interest - repaid loan - liquidated loan.
    function remainingDebt() public view returns (uint) {
        return _loanAmount.add(_accruedInterest).sub(_alreadyPaidAmount).sub(_liquidatedAmount);
    }

    function updateAccruedInterest() private {
        _accruedInterest = accruedInterest();
        _lastInterestUpdatedAt = now;
    }
}
