pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "./lib/_Configuration.sol";
import "./lib/_DepositManager.sol";


/// @title Main contract
contract Protocol is Ownable, Pausable {
    using _Configuration for _Configuration.State;
    using _DepositManager for _DepositManager.State;

    _Configuration.State private _configuration;
    _DepositManager.State private _depositManager;

    /// --- Deposit ---

    /// @notice Get enabled deposit terms
    /// @return A list of enabled deposit terms
    function getDepositTerms() external whenNotPaused view returns (uint[] memory) {
        return _depositManager.enabledDepositTerms;
    }

    /// @notice Enable a deposit term
    /// @param term Deposit term to enable
    function enableDepositTerm(uint term) external whenNotPaused onlyOwner {
        _depositManager.enableDepositTerm(term);
    }

    /// @notice Disable a deposit term
    /// @param term Deposit term to disable
    function disableDepositTerm(uint term) external whenNotPaused onlyOwner {
        _depositManager.disableDepositTerm(term);
    }

    /// --- Configuration ---

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
