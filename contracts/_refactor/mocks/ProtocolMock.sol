pragma solidity ^0.5.0;

import '../impl/Protocol.sol';
import '../impl/lib/_LiquidityPools.sol';

contract ProtocolMock is Protocol {
    function getPoolGroup(address tokenAddress)
        external
        view
        returns (bool isInitialized, uint256 numPools, uint256 firstPoolId)
    {
        _LiquidityPools.PoolGroup storage poolGroup = _liquidityPools
            .poolGroups[tokenAddress];

        return (
            poolGroup.isInitialized,
            poolGroup.numPools,
            poolGroup.firstPoolId
        );
    }

    function addAvailableCollateral(
        address accountAddress,
        address tokenAddress,
        uint256 amount
    ) external {
        _loanManager.addAvailableCollateral(
            accountAddress,
            tokenAddress,
            amount
        );
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
}
