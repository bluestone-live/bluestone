pragma solidity ^0.5.0;

import '../interface/IOasisDex.sol';

contract OasisDexMock is IOasisDex {
    bool public stopped;
    bool public buyEnabled = true;
    bool public matchingEnabled = true;

    function isClosed() external view returns (bool) {
        return stopped;
    }

    function getBuyAmount(
        address, /* buy_gem */
        address, /* pay_gem */
        uint256 /* pay_amt */
    ) external view returns (uint256) {
        return 1;
    }

    function getPayAmount(
        address, /* pay_gem */
        address, /* buy_gem */
        uint256 /* buy_amt */
    ) external view returns (uint256) {
        return 1;
    }
}
