pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract PriceOracle is Ownable {
    // Mapping of asset addresses and their corresponding price in terms of Eth-Wei.
    mapping(address => uint) private assetPrices;
    
    function getPrice(address asset) external returns (uint) {
        return assetPrices[asset];
    }
    
    function setPrice(address asset, uint requestedPrice) external onlyOwner {
        // TODO: make sure new price is reasonable
        assetPrices[asset] = requestedPrice;
   }
}
