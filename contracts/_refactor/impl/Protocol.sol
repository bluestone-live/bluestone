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

    function enableDepositTerm(uint term) external whenNotPaused onlyOwner {
        _depositManager.enableDepositTerm(term);
    }

    function disableDepositTerm(uint term) external whenNotPaused onlyOwner {
        _depositManager.disableDepositTerm(term);
    }

    function getDepositTerms() external whenNotPaused view returns (uint[] memory depositTerms) {
        return _depositManager.enabledDepositTerms;
    }

    /// --- Configuration ---

    function setProtocolAddress(address protocolAddress) external whenNotPaused onlyOwner {
        _configuration.setProtocolAddress(protocolAddress);
    }

    function getProtocolAddress() external whenNotPaused view returns (address protocolAddress) {
        return _configuration.protocolAddress;
    }
}
