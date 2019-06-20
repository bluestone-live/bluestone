pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


/// Stores token prices submitted by a poster.
/// Note this is a minimal implementation, expect to add more sophiscated price check.
contract PriceOracle is Ownable {
    // Mapping of asset addresses and their corresponding USD price in the scale of 1e18.
    mapping(address => uint) private _assetPrices;
    
    function getPrice(address asset) external view returns (uint) {
        return _assetPrices[asset];
    }
    
   function setPrices(address[] calldata assetList, uint[] calldata requestedPriceList) external onlyOwner {
        require(assetList.length == requestedPriceList.length, "Invalid input.");

        for (uint i = 0; i < assetList.length; i++) {
            setPrice(assetList[i], requestedPriceList[i]);
        }
   }

    function setPrice(address asset, uint requestedPrice) public onlyOwner {
        require(requestedPrice > 0, "Invalid price.");

        // TODO: make sure new price is reasonable
        _assetPrices[asset] = requestedPrice;
   }
}
