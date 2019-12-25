pragma solidity ^0.6.0;

interface IPriceOracle {
    function getPrice() external view virtual returns (uint256);
}
