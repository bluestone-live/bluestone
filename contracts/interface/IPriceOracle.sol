pragma solidity ^0.5.0;

contract IPriceOracle {
    function getPrice() external view returns (uint256);
}
