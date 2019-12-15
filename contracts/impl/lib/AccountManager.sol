pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

library AccountManager {
    using SafeMath for uint256;

    struct State {
        // account -> stats
        mapping(address => Statistics) accountStats;
    }

    struct Statistics {
        // key -> integer value
        mapping(string => uint256) generalStats;
        // asset -> key -> integer value
        mapping(address => mapping(string => uint256)) assetStats;
    }

    function getAccountGeneralStat(
        State storage self,
        address accountAddress,
        string calldata key
    ) external view returns (uint256) {
        return self.accountStats[accountAddress].generalStats[key];
    }

    function getAccountTokenStat(
        State storage self,
        address accountAddress,
        address tokenAddress,
        string calldata key
    ) external view returns (uint256) {
        return self.accountStats[accountAddress].assetStats[tokenAddress][key];
    }

    function setAccountGeneralStat(
        State storage self,
        address accountAddress,
        string calldata key,
        uint256 value
    ) external {
        self.accountStats[accountAddress].generalStats[key] = value;
    }

    function addToAccountGeneralStat(
        State storage self,
        address accountAddress,
        string calldata key,
        uint256 value
    ) external {
        self.accountStats[accountAddress].generalStats[key] = self
            .accountStats[accountAddress]
            .generalStats[key]
            .add(value);
    }

    function setAccountTokenStat(
        State storage self,
        address accountAddress,
        address tokenAddress,
        string calldata key,
        uint256 value
    ) external {
        self.accountStats[accountAddress].assetStats[tokenAddress][key] = value;
    }

    function addToAccountTokenStat(
        State storage self,
        address accountAddress,
        address tokenAddress,
        string calldata key,
        uint256 value
    ) external {
        self.accountStats[accountAddress].assetStats[tokenAddress][key] = self
            .accountStats[accountAddress]
            .assetStats[tokenAddress][key]
            .add(value);
    }
}
