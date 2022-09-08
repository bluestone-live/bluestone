// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import '@openzeppelin/contracts/access/Ownable.sol';
import './interface/IPriceOracle.sol';

/// A simple price oracle that receives price update from owner only.
contract SingleFeedPriceOracle is IPriceOracle, Ownable {
    uint256 private _price;
    uint256 public lastUpdatedAt;

    function updatePriceIfNeeded() external pure override {
        return;
    }

    function getPrice() external view override returns (uint256) {
        return _price;
    }

    function setPrice(uint256 requestedPrice) external onlyOwner {
        require(requestedPrice > 0, 'PriceOracle: invalid price');

        _price = requestedPrice;
        lastUpdatedAt = block.timestamp;
    }
}
