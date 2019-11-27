pragma solidity ^0.5.0;

import '../interface/IPriceOracle.sol';

/// @title Price oracle that returns a fixed price in USD.
contract FixedPriceOracle is IPriceOracle {
    uint256 private _price;

    constructor(uint256 price) public {
        _price = price;
    }

    function getPrice() external view returns (uint256) {
        return _price;
    }
}
