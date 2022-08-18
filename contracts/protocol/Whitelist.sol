pragma solidity ^0.6.7;

import '@openzeppelin/contracts/access/Ownable.sol';
import './interface/IWhitelist.sol';

contract Whitelist is Ownable, IWhitelist {
    address[] private administrators;
    address[] private whitelistedLenders;
    address[] private whitelistedBorrowers;
    mapping(address => bool) public isAdministrator;
    mapping(address => bool) public isLenderWhitelisted;
    mapping(address => bool) public isBorrowerWhitelisted;

    event AddAdministrator(address indexed account);
    event RemoveAdministrator(address indexed account);
    event AddLenderWhitelisted(address indexed account);
    event RemoveLenderWhitelisted(address indexed account);
    event AddBorrowerWhitelisted(address indexed account);
    event RemoveBorrowerWhitelisted(address indexed account);

    constructor() public {
        administrators.push(msg.sender);
        isAdministrator[msg.sender] = true;
    }

    modifier onlyAdministrator() {
        require(
            isAdministrator[msg.sender],
            'Whitelist: caller is not administrator'
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

    function getAdministrators()
        external
        view
        override
        onlyAdministrator
        returns (address[] memory)
    {
        return administrators;
    }

    function getWhitelistedLenders()
        external
        view
        override
        onlyAdministrator
        returns (address[] memory)
    {
        return whitelistedLenders;
    }

    function getWhitelistedBorrowers()
        external
        view
        override
        onlyAdministrator
        returns (address[] memory)
    {
        return whitelistedBorrowers;
    }

    function addAdministrator(address account) external override onlyOwner {
        require(
            !isAdministrator[account],
            'Whitelist: account is already administrator'
        );
        administrators.push(account);
        isAdministrator[account] = true;
        emit AddAdministrator(account);
    }

    function removeAdministrator(address account) external override onlyOwner {
        require(
            isAdministrator[account],
            'Whitelist: account is not administrator'
        );
        require(
            owner() != account,
            'Whitelist: can not remove owner from administrators'
        );
        address lastAccount = administrators[administrators.length - 1];
        administrators.pop();
        for (uint256 i = 0; i < administrators.length; i++) {
            if (administrators[i] == account) {
                administrators[i] = lastAccount;
                break;
            }
        }
        delete isAdministrator[account];
        emit RemoveAdministrator(account);
    }

    function addLenderWhitelisted(address account)
        external
        override
        onlyAdministrator
    {
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
        onlyAdministrator
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
        onlyAdministrator
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
        onlyAdministrator
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
