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

    // Just for unit testing, so it won't check the msg.sender
    function setAccountGeneralStat(
        address accountAddress,
        string calldata key,
        uint value
    )
      external
    {
        _accountManager.setAccountGeneralStat(accountAddress, key, value);
    }

    function setAccountTokenStat(
        address accountAddress,
        address tokenAddress,
        string calldata key,
        uint value
    )
      external
    {
        _accountManager.setAccountTokenStat(
            accountAddress,
            tokenAddress,
            key,
            value
        );
    }
}
