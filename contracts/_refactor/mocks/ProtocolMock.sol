pragma solidity ^0.5.0;

import '../impl/Protocol.sol';
import '../impl/lib/_LiquidityPools.sol';

contract ProtocolMock is Protocol {
    function getPoolGroup(address tokenAddress, uint256 depositTerm)
        external
        view
        returns (bool isInitialized, uint256 firstPoolId, uint256 lastPoolId)
    {
        _LiquidityPools.PoolGroup storage poolGroup = _liquidityPools
            .poolGroups[tokenAddress][depositTerm];

        return (
            poolGroup.isInitialized,
            poolGroup.firstPoolId,
            poolGroup.lastPoolId
        );
    }
}
