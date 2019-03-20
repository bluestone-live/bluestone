pragma solidity ^0.5.0;

import "./PoolGroup.sol";


contract LiquidityPools {
    mapping(uint8 => PoolGroup) public poolGroups;

    constructor() public {
        poolGroups[1] = new PoolGroup(1);
        poolGroups[7] = new PoolGroup(7);
        poolGroups[30] = new PoolGroup(30);
    }
}
