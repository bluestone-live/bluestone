// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import '@openzeppelin/contracts/access/Ownable.sol';
import './interface/IWhitelist.sol';

contract Whitelist is Ownable, IWhitelist {
    address[] private whitelistedKeepers;
    address[] private whitelistedLenders;
    address[] private whitelistedBorrowers;
    mapping(address => bool) public isKeeperWhitelisted;
    mapping(address => bool) public isLenderWhitelisted;
    mapping(address => bool) public isBorrowerWhitelisted;

    modifier onlyWhitelistedKeeper() {
        require(
            isKeeperWhitelisted[msg.sender],
            'Whitelist: caller is not whitelisted keeper'
        );
        _;
    }

    modifier onlyWhitelistedLender() {
        require(
            isLenderWhitelisted[msg.sender],
            'Whitelist: caller is not whitelisted lender'
        );
        _;
    }

    modifier onlyWhitelistedBorrower() {
        require(
            isBorrowerWhitelisted[msg.sender],
            'Whitelist: caller is not whitelisted borrower'
        );
        _;
    }

    function getWhitelistedKeepers()
        external
        view
        override
        returns (address[] memory)
    {
        return whitelistedKeepers;
    }

    function getWhitelistedLenders()
        external
        view
        override
        returns (address[] memory)
    {
        return whitelistedLenders;
    }

    function getWhitelistedBorrowers()
        external
        view
        override
        returns (address[] memory)
    {
        return whitelistedBorrowers;
    }

    function addKeeperWhitelisted(address account) external override onlyOwner {
        require(
            !isKeeperWhitelisted[account],
            'Whitelist: keeper account is already whitelisted'
        );
        whitelistedKeepers.push(account);
        isKeeperWhitelisted[account] = true;
        emit AddKeeperWhitelisted(account);
    }

    function removeKeeperWhitelisted(address account)
        external
        override
        onlyOwner
    {
        require(
            isKeeperWhitelisted[account],
            'Whitelist: keeper account is not whitelisted'
        );
        address lastAccount = whitelistedKeepers[whitelistedKeepers.length - 1];
        whitelistedKeepers.pop();
        for (uint256 i = 0; i < whitelistedKeepers.length; i++) {
            if (whitelistedKeepers[i] == account) {
                whitelistedKeepers[i] = lastAccount;
                break;
            }
        }
        delete isKeeperWhitelisted[account];
        emit RemoveKeeperWhitelisted(account);
    }

    function addLenderWhitelisted(address account) external override onlyOwner {
        require(
            !isLenderWhitelisted[account],
            'Whitelist: lender account is already whitelisted'
        );
        whitelistedLenders.push(account);
        isLenderWhitelisted[account] = true;
        emit AddLenderWhitelisted(account);
    }

    function removeLenderWhitelisted(address account)
        external
        override
        onlyOwner
    {
        require(
            isLenderWhitelisted[account],
            'Whitelist: lender account is not whitelisted'
        );
        address lastAccount = whitelistedLenders[whitelistedLenders.length - 1];
        whitelistedLenders.pop();
        for (uint256 i = 0; i < whitelistedLenders.length; i++) {
            if (whitelistedLenders[i] == account) {
                whitelistedLenders[i] = lastAccount;
                break;
            }
        }
        delete isLenderWhitelisted[account];
        emit RemoveLenderWhitelisted(account);
    }

    function addBorrowerWhitelisted(address account)
        external
        override
        onlyOwner
    {
        require(
            !isBorrowerWhitelisted[account],
            'Whitelist: borrower account is already whitelisted'
        );
        whitelistedBorrowers.push(account);
        isBorrowerWhitelisted[account] = true;
        emit AddBorrowerWhitelisted(account);
    }

    function removeBorrowerWhitelisted(address account)
        external
        override
        onlyOwner
    {
        require(
            isBorrowerWhitelisted[account],
            'Whitelist: borrower account is not whitelisted'
        );
        address lastAccount = whitelistedBorrowers[
            whitelistedBorrowers.length - 1
        ];
        whitelistedBorrowers.pop();
        for (uint256 i = 0; i < whitelistedBorrowers.length; i++) {
            if (whitelistedBorrowers[i] == account) {
                whitelistedBorrowers[i] = lastAccount;
                break;
            }
        }
        delete isBorrowerWhitelisted[account];
        emit RemoveBorrowerWhitelisted(account);
    }
}
