pragma solidity ^0.6.7;

import './interface/IPriceOracle.sol';


/// @title Price oracle that returns a fixed price in USD.
contract FixedPriceOracle is IPriceOracle {
    uint256 private _price;

    constructor(uint256 price) public {
        _price = price;
    }

    function updatePriceIfNeeded() external override {
        return;
    }

    function getPrice() external override view returns (uint256) {
        return _price;
    }
}
