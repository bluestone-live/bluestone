pragma solidity ^0.5.0;

// TODO(desmond): remove `_` after contract refactor is complete.
library _Configuration {
    struct State {
        address protocolAddress;
    }

    function setProtocolAddress(State storage self, address protocolAddress) external {
        require(protocolAddress != address(0), "Configuration: invalid protocol address");

        self.protocolAddress = protocolAddress;
    }
}
