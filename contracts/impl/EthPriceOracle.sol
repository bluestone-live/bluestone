pragma solidity ^0.6.0;

import '../interface/IPriceOracle.sol';
import '../interface/IMedianizer.sol';

/// @title Price oracle that fetches ETH price in USD.
contract EthPriceOracle is IPriceOracle {
    IMedianizer public medianizer;

    constructor(address medianizerAddress) public {
        medianizer = IMedianizer(medianizerAddress);
    }

    function getPrice() external view override returns (uint256) {
        (bytes32 value, ) = medianizer.peek();
        return uint256(value);
    }
}
