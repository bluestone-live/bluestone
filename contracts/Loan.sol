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
    uint private _accuredInterest;
    uint private _alreadyPaidAmount;
    uint private _createdAt;
    uint private _lastRepaidAt;

    /// Deposit Term -> Pool Index -> Amount
    /// How much have one loaned from a specific pool (identified by Pool Index) 
    /// in a specific pool group (identified by Deposit Term).
    mapping(uint8 => mapping(uint8 => uint)) private records;

    constructor(address owner, uint8 term, uint loanAmount, uint collateralAmount, uint interestRate) public {
        _owner = owner;
        _term = term;
        _loanAmount = loanAmount;
        _collateralAmount = collateralAmount;
        _interestRate = interestRate;
        _accuredInterest = 0;
        _alreadyPaidAmount = 0;
        _createdAt = now;
        _lastRepaidAt = now;
    }

    function setRecord(uint8 depositTerm, uint8 poolIndex, uint amount) external {
        require(amount > 0);

        records[depositTerm][poolIndex] = amount;
    }

    function addCollateral(uint amount) external {
        require(!isFullyRepaid());

        _collateralAmount = _collateralAmount.add(amount);    
    }

    /// @param amount The amount to repay (or -1 for max)
    /// @return repaid amount
    function repay(uint amount) external returns (uint) {
        require(!isFullyRepaid());

        uint prevRemainingDebt = _loanAmount.add(_accuredInterest).sub(_alreadyPaidAmount);
        uint _interestAfterLastRepaid = interestAfterLastRepaid(prevRemainingDebt);
        uint currRemainingDebt = prevRemainingDebt.add(_interestAfterLastRepaid);

        uint repaidAmount;

        if (amount == uint(-1)) {
            repaidAmount = currRemainingDebt;
        } else {
            require(amount <= currRemainingDebt);
            repaidAmount = amount;
        }

        _alreadyPaidAmount = _alreadyPaidAmount.add(repaidAmount);
        _accuredInterest = _accuredInterest.add(_interestAfterLastRepaid);
        _lastRepaidAt = now;

        return repaidAmount;
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

    /// The latest accured interest is calculated upon query
    function accuredInterest() external view returns (uint) {
        uint prevRemainingDebt = _loanAmount.add(_accuredInterest).sub(_alreadyPaidAmount);
        return _accuredInterest.add(interestAfterLastRepaid(prevRemainingDebt));
    }

    function getRecord(uint8 depositTerm, uint8 poolIndex) external view returns (uint) {
        return records[depositTerm][poolIndex];
    }

    function isFullyRepaid() public view returns (bool) {
        return _alreadyPaidAmount == _loanAmount.add(_accuredInterest);
    }

    /// Interest accured from the last time repaid until now: remainingDebt * (r * t)
    function interestAfterLastRepaid(uint remainingDebt) private view returns (uint) {
        return remainingDebt.mulFixed(_interestRate.mul(now - _lastRepaidAt));
    }
}
