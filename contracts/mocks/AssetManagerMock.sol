pragma solidity ^0.5.0;

import "../AssetManager.sol";


contract AssetManagerMock is AssetManager {
    function receive(address asset, address from, uint amount) public {
        _receive(asset, from, amount);
    } 

    function send(address asset, address to, uint amount) public {
        _send(asset, to, amount);
    }
}
