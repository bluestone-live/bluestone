pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "./lib/_Configuration.sol";


/// @title Main contract
contract Protocol is Ownable, Pausable {
    using _Configuration for _Configuration.State;

    _Configuration.State private _configuration;

    /// @notice Get protocol address
    /// @return protocol address
    function getProtocolAddress() external whenNotPaused view returns (address) {
        return _configuration.protocolAddress;
    }

    /// @notice Set protocol address
    /// @param protocolAddress The address for protocol
    function setProtocolAddress(address protocolAddress) external whenNotPaused onlyOwner {
        _configuration.setProtocolAddress(protocolAddress);
    }
}
