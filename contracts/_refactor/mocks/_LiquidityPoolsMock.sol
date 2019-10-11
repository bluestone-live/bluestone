pragma solidity ^0.5.0;

import '../impl/lib/_LiquidityPools.sol';

// TODO(desmond): rename it after refactor complete
contract _LiquidityPoolsMock {
    using _LiquidityPools for _LiquidityPools.State;

    _LiquidityPools.State _liquidityPools;

    function initPoolGroupIfNeeded(address tokenAddress, uint256 depositTerm)
        external
    {
        _liquidityPools.initPoolGroupIfNeeded(tokenAddress, depositTerm);
    }

    function getPoolGroup(address tokenAddress, uint256 depositTerm)
        external
        view
        returns (bool isInitialized, uint256 firstPoolId, uint256 lastPoolId)
    {
        _LiquidityPools.PoolGroup memory poolGroup = _liquidityPools
            .poolGroups[tokenAddress][depositTerm];

        return (
            poolGroup.isInitialized,
            poolGroup.firstPoolId,
            poolGroup.lastPoolId
        );
    }
}
