pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

/// Stores token prices submitted by a poster.
/// Note this is a minimal implementation, expect to add more sophiscated price check.
contract PriceOracle is Ownable {
    // Token address -> USD price in the scale of 1e18
    mapping(address => uint256) private _priceByTokenAddress;

    function getPrice(address tokenAddress) external view returns (uint256) {
        return _priceByTokenAddress[tokenAddress];
    }

    function setPrices(
        address[] calldata tokenAddressList,
        uint256[] calldata requestedPriceList
    ) external onlyOwner {
        require(
            tokenAddressList.length == requestedPriceList.length,
            'PriceOracle: invalid input'
        );

        for (uint256 i = 0; i < tokenAddressList.length; i++) {
            setPrice(tokenAddressList[i], requestedPriceList[i]);
        }
    }

    function setPrice(address tokenAddress, uint256 requestedPrice)
        public
        onlyOwner
    {
        require(requestedPrice > 0, 'PriceOracle: invalid price');

        // TODO: make sure new price is reasonable
        _priceByTokenAddress[tokenAddress] = requestedPrice;
    }
}
