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

    function addDepositToPool(
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositTerm,
        uint256[] calldata loanTermList
    ) external returns (uint256 poolId) {
        return
            _liquidityPools.addDepositToPool(
                tokenAddress,
                depositAmount,
                depositTerm,
                loanTermList
            );
    }

    function subtractDepositFromPool(
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositTerm,
        uint256 poolId,
        uint256[] calldata loanTermList
    ) external {
        _liquidityPools.subtractDepositFromPool(
            tokenAddress,
            depositAmount,
            depositTerm,
            poolId,
            loanTermList
        );
    }

    function getPool(
        address tokenAddress,
        uint256 depositTerm,
        uint256 poolIndex
    )
        external
        view
        returns (
            uint256 depositAmount,
            uint256 borrowedAmount,
            uint256 availableAmount,
            uint256 loanInterest
        )
    {
        return _liquidityPools.getPool(tokenAddress, depositTerm, poolIndex);
    }

    function getPoolById(
        address tokenAddress,
        uint256 depositTerm,
        uint256 poolId
    )
        external
        view
        returns (
            uint256 depositAmount,
            uint256 borrowedAmount,
            uint256 availableAmount,
            uint256 loanInterest
        )
    {
        return _liquidityPools.getPoolById(tokenAddress, depositTerm, poolId);
    }

    /// --- Helpers

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

    function getPoolGroupAvailableAmountByTerm(
        address tokenAddress,
        uint256 depositTerm,
        uint256 loanTerm
    ) external view returns (uint256 availableAmountByTerm) {
        _LiquidityPools.PoolGroup storage poolGroup = _liquidityPools
            .poolGroups[tokenAddress][depositTerm];

        return poolGroup.availableAmountByTerm[loanTerm];
    }

}
