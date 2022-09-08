// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import '../common/interface/IChainlink.sol';
import './interface/IPriceOracle.sol';

/// @title Price oracle that fetches BTC price in USD.
contract BtcPriceOracle is IPriceOracle {
    IChainlink public aggregator;
    uint8 public tokenDecimals = 18;

    constructor(address aggregatorAddress) {
        aggregator = IChainlink(aggregatorAddress);
    }

    function updatePriceIfNeeded() external pure override {
        return;
    }

    function getPrice() external view override returns (uint256 tokenPrice) {
        (
            ,
            /*uint80 roundID*/
            int256 rawPrice,
            ,
            ,

        ) = /*uint startedAt*/
            /*uint timeStamp*/
            /*uint80 answeredInRound*/
            aggregator.latestRoundData();
        uint8 decimals = aggregator.decimals();

        tokenPrice = uint256(rawPrice) * (10**(tokenDecimals - decimals));
    }
}
