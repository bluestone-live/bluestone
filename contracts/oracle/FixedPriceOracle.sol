// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import './interface/IPriceOracle.sol';

/// @title Price oracle that returns a fixed price in USD.
contract FixedPriceOracle is IPriceOracle {
    uint256 private _price;

    constructor(uint256 price) {
        _price = price;
    }

    function updatePriceIfNeeded() external pure override {
        return;
    }

    function getPrice() external view override returns (uint256) {
        return _price;
    }
}
