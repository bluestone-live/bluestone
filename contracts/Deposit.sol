pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./FixedMath.sol";
import "./DateTime.sol";


contract Deposit {
    using SafeMath for uint;
    using FixedMath for uint;

    address private _asset;
    address private _owner;
    uint private _term;
    uint private _amount;
    uint private _profitRatio;
    uint private _withdrewAmount;
    uint private _createdAt;
    uint private _maturedAt;
    uint private _withdrewAt;
    uint private _poolId;

    uint private constant DAY_IN_SECONDS = 86400;

    constructor(
        address asset,
        address owner, 
        uint term, 
        uint amount, 
        uint profitRatio,
        uint poolId
    ) public {
        require(amount > 0);

        _asset = asset;
        _owner = owner;
        _term = term;
        _amount = amount;
        _profitRatio = profitRatio;
        _poolId = poolId;
        _withdrewAmount = 0;
        _createdAt = now;

        /// If a 1-day deposit is created at GMT 13:00:00 on Monday, it will be matured 
        /// at GMT 00:00:00 on Thursday (24 - 13 + 1 * 24 hours)
        _maturedAt = _createdAt + 
            DateTime.secondsUntilMidnight(_createdAt) +
            _term * DAY_IN_SECONDS;
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

    function asset() external view returns (address) {
        return _asset;
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

    function term() external view returns (uint) {
        return _term;
    }

    function createdAt() external view returns (uint) {
        return _createdAt;
    }

    function maturedAt() external view returns (uint) {
        return _maturedAt;
    }

    function profitRatio() external view returns (uint) {
        return _profitRatio;
    }

    function poolId() external view returns (uint) {
        return _poolId;
    }

    function withdrawDepositAndInterest(uint currInterestIndex) external returns (uint, uint) {
        uint totalInterests = _amount.mulFixed(currInterestIndex);
        uint interestsForShareholders = totalInterests.mulFixed(_profitRatio);
        uint interestsForDepositor = totalInterests.sub(interestsForShareholders);

        _withdrewAmount = _amount.add(interestsForDepositor);
        _withdrewAt = now;

        return (_withdrewAmount, interestsForShareholders);
    }

    function withdrawDeposit() external returns (uint) {
        _withdrewAmount = _amount;
        _withdrewAt = now;

        return _withdrewAmount;
    }
}
