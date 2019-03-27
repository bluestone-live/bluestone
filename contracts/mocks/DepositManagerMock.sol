pragma solidity ^0.5.0;

import "../DepositManager.sol";
import "../PoolGroup.sol";
import "../LiquidityPools.sol";


contract DepositManagerMock is DepositManager {
    constructor(LiquidityPools liquidityPools) public DepositManager(liquidityPools) { 
    }

    function getOneTimeDepositFromPool(uint8 depositTerm, uint8 index) public view returns (uint) {
        PoolGroup poolGroup = _liquidityPools.poolGroups(depositTerm);
        return poolGroup.getOneTimeDepositFromPool(index);
    }

    function getRecurringDepositFromPool(uint8 depositTerm, uint8 index) public view returns (uint) {
        PoolGroup poolGroup = _liquidityPools.poolGroups(depositTerm);
        return poolGroup.getRecurringDepositFromPool(index);
    }
}
