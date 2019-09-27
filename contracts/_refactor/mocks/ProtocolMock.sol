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
        uint256 value
    ) external {
        _accountManager.setAccountGeneralStat(accountAddress, key, value);
    }

    function setAccountTokenStat(
        address accountAddress,
        address tokenAddress,
        string calldata key,
        uint256 value
    ) external {
        _accountManager.setAccountTokenStat(
            accountAddress,
            tokenAddress,
            key,
            value
        );
    }

    function addFreedCollateral(
        address accountAddress,
        address tokenAddress,
        uint256 amount
    ) external {
        _loanManager.addFreedCollateral(accountAddress, tokenAddress, amount);
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

    function getPriceOracleAddress()
        public
        view
        returns (address priceOracleAddress)
    {
        return _configuration.priceOracleAddress;
    }
}
