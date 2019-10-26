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

    function addDepositToPool(
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositWeight
    ) external returns (uint256 poolId) {
        return
            _liquidityPools.addDepositToPool(
                tokenAddress,
                depositAmount,
                depositWeight
            );
    }

    function subtractDepositFromPool(
        address tokenAddress,
        uint256 depositAmount,
        uint256 poolId,
        uint256 depositWeight
    ) external {
        _liquidityPools.subtractDepositFromPool(
            tokenAddress,
            depositAmount,
            poolId,
            depositWeight
        );
    }

    function getPool(address tokenAddress, uint256 poolIndex)
        external
        view
        returns (
            uint256 depositAmount,
            uint256 borrowedAmount,
            uint256 availableAmount,
            uint256 loanInterest,
            uint256 totalDepositWeight
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
            uint256 loanInterest,
            uint256 totalDepositWeight
        )
    {
        return _liquidityPools.getPoolById(tokenAddress, poolId);
    }

    function getAvailableAmountOfAllPools(address tokenAddress)
        external
        view
        returns (uint256[] memory availableAmount)
    {
        return _liquidityPools.getAvailableAmountOfAllPools(tokenAddress);
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

    function populatePoolGroup(
        address tokenAddress,
        uint256[] calldata depositAmountList,
        uint256[] calldata borrowedAmountList
    ) external {
        _LiquidityPools.PoolGroup storage poolGroup = _liquidityPools
            .poolGroups[tokenAddress];

        require(
            depositAmountList.length <= poolGroup.numPools + 1,
            'LiquidityPoolsMock: invalid depositAmountList length'
        );
        require(
            borrowedAmountList.length <= poolGroup.numPools + 1,
            'LiquidityPoolsMock: invalid borrowedAmountList length'
        );
        require(
            depositAmountList.length == borrowedAmountList.length,
            'LiquidityPoolsMock: depositAmountList and borrowedAmountList must have the same length'
        );

        uint256 poolId = poolGroup.firstPoolId;

        for (uint256 i = 0; i < depositAmountList.length; i++) {
            _LiquidityPools.Pool storage pool = poolGroup.poolsById[poolId];
            pool.depositAmount = depositAmountList[i];
            pool.borrowedAmount = borrowedAmountList[i];
            pool.availableAmount = depositAmountList[i] - borrowedAmountList[i];
            poolId++;
        }
    }
}
