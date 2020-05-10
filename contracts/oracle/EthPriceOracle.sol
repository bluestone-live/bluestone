pragma solidity ^0.6.7;

import '../common/interface/IMedianizer.sol';
import './interface/IPriceOracle.sol';


/// @title Price oracle that fetches ETH price in USD.
contract EthPriceOracle is IPriceOracle {
    IMedianizer public medianizer;

    constructor(address medianizerAddress) public {
        medianizer = IMedianizer(medianizerAddress);
    }

    function updatePriceIfNeeded() external override {
        return;
    }

    function getPrice() external override view returns (uint256) {
        (bytes32 value, ) = medianizer.peek();
        return uint256(value);
    }
}
