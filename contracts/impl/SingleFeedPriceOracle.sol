pragma solidity ^0.6.0;

import './Ownable.sol';
import '../interface/IPriceOracle.sol';

/// A simple price oracle that receives price update from owner only.
contract SingleFeedPriceOracle is IPriceOracle, Ownable {
    uint256 private _price;
    uint256 public lastUpdatedAt;

    function updatePriceIfNeeded() external override {
        return;
    }

    function getPrice() external view override returns (uint256) {
        return _price;
    }

    function setPrice(uint256 requestedPrice) external onlyOwner {
        require(requestedPrice > 0, 'PriceOracle: invalid price');

        _price = requestedPrice;
        lastUpdatedAt = now;
    }
}
