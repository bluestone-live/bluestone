// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;
import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';

/**
 * Network: Goerli
 * Aggregator: ETH/USD
 * aggregatorAddress: 0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
 * Aggregator: BTC/USD
 * aggregatorAddress: 0xA39434A63A52E749F02807ae27335515BA4b07F7
 */
interface IChainlink {
    function decimals() external view returns (uint8);

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}
