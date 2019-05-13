pragma solidity ^0.5.0;

import "./ERC20Mock.sol";

contract TokenFactory {
    event TokenCreated(address token);

    mapping(string => address) _tokens;

    uint private constant INITIAL_SUPPLY = 1000 * (10 ** 18);

    function createToken(string memory name, string memory symbol) public returns (address) {
        return createToken(name, symbol, msg.sender, INITIAL_SUPPLY);
    }

    function createToken(
        string memory name, 
        string memory symbol, 
        address owner, 
        uint initialSupply
    ) 
        public 
        returns (address) 
    {
        ERC20Mock token = new ERC20Mock(name, symbol, owner, initialSupply);
        address tokenAddress = address(token);
        _tokens[symbol] = tokenAddress;
        emit TokenCreated(tokenAddress);
        return tokenAddress;
    }

    function getToken(string memory symbol) public view returns (address) {
        return _tokens[symbol];
    }
}
