pragma solidity ^0.6.0;

import './WETH9.sol';
import '../lib/SafeERC20.sol';
import './ERC20.sol';
import '../interface/IPayableProxy.sol';

contract PayableProxy is IPayableProxy {
    WETH9 WETH;
    address protocolAddress;

    constructor(address protocol, address payable WETHAddress) public {
        WETH = WETH9(WETHAddress);
        WETH.approve(protocolAddress, uint256(-1));
        protocolAddress = protocol;
    }

    receive() external payable {}

    function getWETHAddress() external view override returns (address wethAddress) {
        return address(WETH);
    }

    function receiveETH() external payable override {
        require(
            msg.value > 0,
            'PayableProxy: transfer value need to greater than 0'
        );

        // Wrap ETH
        WETH.deposit.value(msg.value)();
        // Send WETH to protocol contract
        WETH.transfer(protocolAddress, msg.value);
    }

    function sendETH(address payable to, uint256 amount) external override {
        require(
            WETH.balanceOf(address(protocolAddress)) >= amount,
            'PayableProxy: Invalid send amount'
        );

        // Transfer WETH from protocol contract
        WETH.transferFrom(protocolAddress, address(this), amount);
        // Unwrap WETH to ETH
        WETH.withdraw(amount);
        // Send ETH to address
        to.transfer(amount);
    }
}
