pragma solidity ^0.6.0;

import '../ERC20.sol';


contract ERC20Mock is ERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals
    ) public {
        name = tokenName;
        symbol = tokenSymbol;
        decimals = tokenDecimals;
    }

    function mint(address account, uint256 value) public {
        _mint(account, value);
    }
}
