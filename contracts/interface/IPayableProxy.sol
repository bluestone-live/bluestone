pragma solidity ^0.6.0;

abstract contract IPayableProxy {
    /// @notice Receive ETH from user address
    function receiveETH() external payable virtual;

    /// @notice Send ETH to address
    /// @param to Send ETH to address
    /// @param amount Amount
    function sendETH(address payable to, uint256 amount) external virtual;

    /// @notice Get mapping token address
    /// @return wethAddress WETH address
    function getWETHAddress() external view virtual returns (address wethAddress);
}
