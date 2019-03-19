pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract AssetManager {
    using SafeERC20 for ERC20;

    /// Receive tokens from an external account and transfer them to the protocol.
    function _receive(address asset, address from, uint amount) internal {
        ERC20 token = ERC20(asset);
        token.safeTransferFrom(from, address(this), amount);
    }

    /// Send tokens to an external account from the protocol.
    function _send(address asset, address to, uint amount) internal {
        ERC20 token = ERC20(asset);
        token.safeTransfer(to, amount);
    }
}
