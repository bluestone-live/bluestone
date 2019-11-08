pragma solidity ^0.5.0;

import '../impl/lib/AccountManager.sol';

contract AccountManagerMock {
    using AccountManager for AccountManager.State;

    AccountManager.State _accountManager;

    function getAccountGeneralStat(address accountAddress, string calldata key)
        external
        view
        returns (uint256)
    {
        return _accountManager.getAccountGeneralStat(accountAddress, key);
    }

    function getAccountTokenStat(
        address accountAddress,
        address tokenAddress,
        string calldata key
    ) external view returns (uint256) {
        return
            _accountManager.getAccountTokenStat(
                accountAddress,
                tokenAddress,
                key
            );
    }

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
}
