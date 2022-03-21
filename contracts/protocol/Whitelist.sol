pragma solidity ^0.6.7;

import '@openzeppelin/contracts/access/Ownable.sol';


contract Whitelist is Ownable {
    address[] public whitelistedAccounts;
    mapping(address => bool) public isWhitelisted;

    event AddWhitelisted(address indexed account);
    event RemoveWhitelisted(address indexed account);

    modifier onlyWhitelisted() {
        require(
            isWhitelisted[msg.sender],
            'Whitelist: caller is not whitelisted'
        );
        _;
    }

    function addWhitelisted(address account) public virtual onlyOwner {
        require(
            !isWhitelisted[account],
            'Whitelist: account is already whitelisted'
        );
        whitelistedAccounts.push(account);
        isWhitelisted[account] = true;
        emit AddWhitelisted(account);
    }

    function removeWhitelisted(address account) public virtual onlyOwner {
        require(
            isWhitelisted[account],
            'Whitelist: account is not whitelisted'
        );
        // Replace the account with the last account
        address lastAccount = whitelistedAccounts[whitelistedAccounts.length -
            1];
        whitelistedAccounts.pop();
        for (uint256 i = 0; i < whitelistedAccounts.length; i++) {
            if (whitelistedAccounts[i] == account) {
                whitelistedAccounts[i] = lastAccount;
                break;
            }
        }
        delete isWhitelisted[account];
        emit RemoveWhitelisted(account);
    }
}
