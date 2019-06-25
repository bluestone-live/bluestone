pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract ERC20Mock is ERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;

    constructor (
        string memory tokenName, 
        string memory tokenSymbol, 
        address owner,
        uint initialSupply
    ) 
        public 
    {
        name = tokenName;
        symbol = tokenSymbol;
        decimals = 18;
        _mint(owner, initialSupply);
    }

    function mint(address account, uint value) public {
        _mint(account, value);
    }
}
