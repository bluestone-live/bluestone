// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract ERC20Mock is ERC20 {
    uint8 tokenDecimals;

    constructor(
        string memory _tokenName,
        string memory _tokenSymbol,
        uint8 _tokenDecimals
    ) ERC20(_tokenName, _tokenSymbol) {
        tokenDecimals = _tokenDecimals;
    }

    function mint(address account, uint256 value) public {
        _mint(account, value);
    }

    function decimals() public view override returns (uint8) {
        return tokenDecimals;
    }
}
