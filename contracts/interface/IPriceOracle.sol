pragma solidity ^0.5.0;

contract IPriceOracle {
    function getPrice(address tokenAddress) external view returns (uint256);

    function setPrices(
        address[] calldata tokenAddressList,
        uint256[] calldata requestedPriceList
    ) external;

    function setPrice(address tokenAddress, uint256 requestedPrice) public;
}
