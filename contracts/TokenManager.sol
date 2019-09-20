pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract TokenManager {
    using SafeERC20 for ERC20;

    // Receive tokens from an account and transfer them to this contract
    function receiveFrom(address account, address asset, uint256 amount)
        external
    {
        ERC20 token = ERC20(asset);
        token.safeTransferFrom(account, address(this), amount);
    }

    // Send tokens to the target account from this contract
    function sendTo(address account, address asset, uint256 amount) external {
        ERC20 token = ERC20(asset);
        token.safeTransfer(account, amount);
    }
}
