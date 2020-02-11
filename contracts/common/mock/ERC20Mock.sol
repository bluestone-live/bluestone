pragma solidity ^0.6.0;

import '../ERC20.sol';

contract ERC20Mock is ERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;

    constructor(string memory tokenName, string memory tokenSymbol) public {
        name = tokenName;
        symbol = tokenSymbol;
        decimals = 18;
    }

    function mint(address account, uint256 value) public {
        _mint(account, value);
    }
}
