pragma solidity ^0.5.0;

// TODO(desmond): remove `_` after contract refactor is complete.
library _AccountManager {

    struct State {
        // account -> stats
        mapping(address => Statistics) accountStats;
    }

    struct Statistics {
        // key -> integer value
        mapping(string => uint) generalStats;

        // asset -> key -> integer value
        mapping(address => mapping(string => uint)) assetStats;
    }

    function getAccountGeneralStat(
        State storage self,
        address accountAddress,
        string calldata key
    )
        external view returns (uint)
    {
        return self.accountStats[accountAddress].generalStats[key];
    }

    function getAccountTokenStat(
        State storage self,
        address accountAddress,
        address tokenAddress,
        string calldata key
    )
        external view returns (uint)
    {
        return self.accountStats[accountAddress].assetStats[tokenAddress][key];
    }

    function setAccountGeneralStat(
        State storage self,
        address accountAddress,
        string calldata key,
        uint value
    )
      external
    {
        self.accountStats[accountAddress].generalStats[key] = value;
    }

    function setAccountTokenStat(
        State storage self,
        address accountAddress,
        address tokenAddress,
        string calldata key,
        uint value
    )
      external
    {
        self.accountStats[accountAddress].assetStats[tokenAddress][key] = value;
    }
}
