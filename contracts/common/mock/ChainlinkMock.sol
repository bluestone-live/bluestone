// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;
import '../interface/IChainlink.sol';

contract ChainlinkMock is IChainlink {
    // uint80 public roundId = 1;
    int256 public answer;

    // uint256 public startedAt = 1000000000;
    // uint256 public updatedAt = 1200000000;
    // uint80 public answeredInRound = 213323;

    function decimals() external pure override returns (uint8) {
        return 18;
    }

    function setPrice(int256 _price) external {
        answer = _price;
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80,
            int256,
            uint256,
            uint256,
            uint80
        )
    {
        return (0, answer, 0, 0, 0);
    }
}
