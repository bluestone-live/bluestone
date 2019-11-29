pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import '../interface/IPriceOracle.sol';

/// A simple price oracle that receives price update from owner only.
contract SingleFeedPriceOracle is IPriceOracle, Ownable {
    uint256 private _price;

    function getPrice() external view returns (uint256) {
        return _price;
    }

    function setPrice(uint256 requestedPrice) external onlyOwner {
        require(requestedPrice > 0, 'PriceOracle: invalid price');

        _price = requestedPrice;
    }
}
