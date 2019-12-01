pragma solidity ^0.5.0;

import '../interface/IOasisDex.sol';
import '../lib/FixedMath.sol';

contract OasisDexMock is IOasisDex {
    using FixedMath for uint256;

    bool public stopped;
    bool public buyEnabled = true;
    bool public matchingEnabled = true;
    uint256 private _ethPrice;

    function isClosed() external view returns (bool) {
        return stopped;
    }

    function setEthPrice(uint256 ethPrice) external {
        _ethPrice = ethPrice;
    }

    function getBuyAmount(
        address, /* buy_gem */
        address, /* pay_gem */
        uint256 pay_amt
    ) external view returns (uint256) {
        return _ethPrice.mulFixed(pay_amt);
    }

    function getPayAmount(
        address, /* pay_gem */
        address, /* buy_gem */
        uint256 buy_amt
    ) external view returns (uint256) {
        return _ethPrice.mulFixed(buy_amt);
    }
}
