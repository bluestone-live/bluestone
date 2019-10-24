pragma solidity ^0.5.0;

import '../impl/lib/_LiquidityPools.sol';

// TODO(desmond): rename it after refactor complete
contract _LiquidityPoolsMock {
    using _LiquidityPools for _LiquidityPools.State;

    _LiquidityPools.State _liquidityPools;

    function initPoolGroupIfNeeded(address tokenAddress, uint256 numPools)
        external
    {
        _liquidityPools.initPoolGroupIfNeeded(tokenAddress, numPools);
    }

    function addDepositToPool(address tokenAddress, uint256 depositAmount)
        external
        returns (uint256 poolId)
    {
        return _liquidityPools.addDepositToPool(tokenAddress, depositAmount);
    }

    function subtractDepositFromPool(
        address tokenAddress,
        uint256 depositAmount,
        uint256 poolId
    ) external {
        _liquidityPools.subtractDepositFromPool(
            tokenAddress,
            depositAmount,
            poolId
        );
    }

    function getPool(address tokenAddress, uint256 poolIndex)
        external
        view
        returns (
            uint256 depositAmount,
            uint256 borrowedAmount,
            uint256 availableAmount,
            uint256 loanInterest
        )
    {
        return _liquidityPools.getPool(tokenAddress, poolIndex);
    }

    function getPoolById(address tokenAddress, uint256 poolId)
        external
        view
        returns (
            uint256 depositAmount,
            uint256 borrowedAmount,
            uint256 availableAmount,
            uint256 loanInterest
        )
    {
        return _liquidityPools.getPoolById(tokenAddress, poolId);
    }

    /// --- Helpers

    function getPoolGroup(address tokenAddress)
        external
        view
        returns (bool isInitialized, uint256 numPools, uint256 firstPoolId)
    {
        _LiquidityPools.PoolGroup memory poolGroup = _liquidityPools
            .poolGroups[tokenAddress];

        return (
            poolGroup.isInitialized,
            poolGroup.numPools,
            poolGroup.firstPoolId
        );
    }
}
