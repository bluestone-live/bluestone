pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import './FixedMath.sol';
import './DateTime.sol';

contract Deposit {
    using SafeMath for uint256;
    using FixedMath for uint256;

    address private _asset;
    address private _owner;
    uint256 private _term;
    uint256 private _amount;
    uint256 private _protocolReserveRatio;
    uint256 private _withdrewAmount;
    uint256 private _createdAt;
    uint256 private _maturedAt;
    uint256 private _withdrewAt;
    uint256 private _poolId;

    uint256 private constant DAY_IN_SECONDS = 86400;

    constructor(
        address asset,
        address owner,
        uint256 term,
        uint256 amount,
        uint256 protocolReserveRatio,
        uint256 poolId
    ) public {
        require(amount > 0);

        _asset = asset;
        _owner = owner;
        _term = term;
        _amount = amount;
        _protocolReserveRatio = protocolReserveRatio;
        _poolId = poolId;
        _withdrewAmount = 0;
        _createdAt = now;

        /// If a 1-day deposit is created at GMT 13:00:00 on Monday, it will be matured
        /// at GMT 00:00:00 on Thursday (24 - 13 + 1 * 24 hours)
        _maturedAt =
            _createdAt +
            DateTime.secondsUntilMidnight(_createdAt) +
            _term *
            DAY_IN_SECONDS;
    }

    function isWithdrawn() public view returns (bool) {
        return _withdrewAt != 0;
    }

    function isMatured() public view returns (bool) {
        return now >= _maturedAt;
    }

    function asset() external view returns (address) {
        return _asset;
    }

    function owner() external view returns (address) {
        return _owner;
    }

    function amount() external view returns (uint256) {
        return _amount;
    }

    function withdrewAmount() external view returns (uint256) {
        return _withdrewAmount;
    }

    function term() external view returns (uint256) {
        return _term;
    }

    function createdAt() external view returns (uint256) {
        return _createdAt;
    }

    function maturedAt() external view returns (uint256) {
        return _maturedAt;
    }

    function protocolReserveRatio() external view returns (uint256) {
        return _protocolReserveRatio;
    }

    function poolId() external view returns (uint256) {
        return _poolId;
    }

    function withdrawDepositAndInterest(uint256 currInterestIndex)
        external
        returns (uint256, uint256)
    {
        uint256 totalInterests = _amount.mulFixed(currInterestIndex);
        uint256 interestsForProtocol = totalInterests.mulFixed(
            _protocolReserveRatio
        );
        uint256 interestsForDepositor = totalInterests.sub(
            interestsForProtocol
        );

        _withdrewAmount = _amount.add(interestsForDepositor);
        _withdrewAt = now;

        return (_withdrewAmount, interestsForProtocol);
    }

    function withdrawDeposit() external returns (uint256) {
        _withdrewAmount = _amount;
        _withdrewAt = now;

        return _withdrewAmount;
    }
}
