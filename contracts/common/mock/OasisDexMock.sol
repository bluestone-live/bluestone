pragma solidity ^0.6.7;

import '../interface/IOasisDex.sol';


contract OasisDexMock is IOasisDex {
    bool public stopped;
    uint256 private _ethPrice;
    uint256 private _buyAmount;
    uint256 private _payAmount;

    function buyEnabled() external override view returns (bool) {
        return true;
    }

    function matchingEnabled() external override view returns (bool) {
        return true;
    }

    function isClosed() external override view returns (bool) {
        return stopped;
    }

    function setEthPrice(uint256 ethPrice) external {
        _ethPrice = ethPrice;
    }

    function setBuyAmount(uint256 buyAmount) external {
        _buyAmount = buyAmount;
    }

    function setPayAmount(uint256 payAmount) external {
        _payAmount = payAmount;
    }

    function getBuyAmount(
        address, /* buy_gem */
        address, /* pay_gem */
        uint256 /* pay_amt */
    ) external override view returns (uint256) {
        return _buyAmount;
    }

    function getPayAmount(
        address, /* pay_gem */
        address, /* buy_gem */
        uint256 /* buy_amt */
    ) external override view returns (uint256) {
        return _payAmount;
    }
}
