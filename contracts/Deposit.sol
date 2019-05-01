pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./FixedMath.sol";
import "./DateTime.sol";


contract Deposit {
    using SafeMath for uint;
    using FixedMath for uint;

    address private _owner;
    uint8 private _term;
    uint private _amount;
    uint private _interestIndex;
    uint private _withdrewAmount;
    bool private _isRecurring;
    uint private _createdAt;
    uint private _maturedAt;
    uint private _withdrewAt;

    uint private constant DAY_IN_SECONDS = 86400;

    constructor(address owner, uint8 term, uint amount, uint interestIndex, bool isRecurring) public {
        require(amount > 0);

        _owner = owner;
        _term = term;
        _amount = amount;
        _interestIndex = interestIndex;
        _withdrewAmount = 0;
        _isRecurring = isRecurring;
        _createdAt = now;

        /// If a 1-day deposit is created at GMT 13:00:00 on Monday, it will be matured 
        /// at GMT 00:00:00 on Thursday (24 - 13 + 1 * 24 hours)
        _maturedAt = _createdAt + 
            DateTime.secondsUntilMidnight(_createdAt) +
            _term * DAY_IN_SECONDS;
    } 

    function calculateWithdrawableAmount(uint currentInterestIndex) public view returns (uint) {
        // total = amount * (currentInterestIndex / depositInterestIndex)
        return _amount.mulFixed(currentInterestIndex).divFixed(_interestIndex);
    }

    function isWithdrawn() public view returns (bool) {
        return _withdrewAt != 0;
    }

    function isMatured() public view returns (bool) {
        return now >= _maturedAt;
    }

    function isOverDue() public view returns (bool) {
        return now >= _maturedAt + 30 * DAY_IN_SECONDS;
    }

    function owner() external view returns (address) {
        return _owner;
    }

    function amount() external view returns (uint) {
        return _amount;
    }

    function withdrewAmount() external view returns (uint) {
        return _withdrewAmount;
    }

    function term() external view returns (uint8) {
        return _term;
    }

    function isRecurring() external view returns (bool) {
        return _isRecurring;
    }

    function createdAt() external view returns (uint) {
        return _createdAt;
    }

    function maturedAt() external view returns (uint) {
        return _maturedAt;
    }

    function enableRecurring() external {
        _isRecurring = true;
    }

    function disableRecurring() external {
        _isRecurring = false;
    }

    function withdrawDepositAndInterest(uint currentInterestIndex) external returns (uint) {
        _withdrewAmount = calculateWithdrawableAmount(currentInterestIndex);
        _withdrewAt = now;

        return _withdrewAmount;
    }

    function withdrawDeposit() external returns (uint) {
        _withdrewAmount = _amount;
        _withdrewAt = now;

        return _withdrewAmount;
    }

    function calculateInterest(uint currentInterestIndex) external view returns (uint) {
        return calculateWithdrawableAmount(currentInterestIndex).sub(_amount);
    }
}
