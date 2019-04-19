pragma solidity ^0.5.0;

import "./PoolGroup.sol";


contract LiquidityPools {
    // asset -> term -> PoolGroup
    mapping(address => mapping(uint8 => PoolGroup)) public poolGroups;
    mapping(address => bool) public isPoolGroupsInitialized;

    function initPoolGroupsIfNeeded(address asset) external {
        if (!isPoolGroupsInitialized[asset]) {
            poolGroups[asset][1] = new PoolGroup(1);
            poolGroups[asset][7] = new PoolGroup(7);
            poolGroups[asset][30] = new PoolGroup(30);
            
            isPoolGroupsInitialized[asset] = true;
        }
    }
}
