pragma solidity ^0.6.7;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';


contract ERC20Mock is ERC20 {
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals
    ) public ERC20(tokenName, tokenSymbol) {
        super._setupDecimals(tokenDecimals);
    }

    function mint(address account, uint256 value) public {
        _mint(account, value);
    }
}
