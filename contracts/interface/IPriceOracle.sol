pragma solidity ^0.6.0;

interface IPriceOracle {
    /// @notice Update the token price if necessary
    /// @dev Call this function before getPrice() if price freshness is important
    function updatePriceIfNeeded() external virtual;

    /// @notice Return the current token price in USD
    /// @return tokenPrice
    function getPrice() external view virtual returns (uint256 tokenPrice);
}
