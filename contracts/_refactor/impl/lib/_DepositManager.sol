pragma solidity ^0.5.0;

// TODO(desmond): remove `_` after contract refactor is complete.
library _DepositManager {
    struct State {
        /// Includes enabled and disabled desposit terms.
        /// We need to keep disabled deposit terms for deposit maturity update.
        uint[] allDepositTerms;

        uint[] enabledDepositTerms;

        // Deposit term -> has been enabled once?
        mapping(uint => bool) isDepositTermInitialized;

        // Deposit term -> enabled?
        mapping(uint => bool) isDepositTermEnabled;
    }

    function enableDepositTerm(State storage self, uint term) external {
        require(!self.isDepositTermEnabled[term], "DepositManager: term already enabled");

        self.isDepositTermEnabled[term] = true;
        self.enabledDepositTerms.push(term);

        // Only add this deposit term if it has not been enabled before
        if (!self.isDepositTermInitialized[term]) {
            self.allDepositTerms.push(term);
            self.isDepositTermInitialized[term] = true;
        }

        /// TODO(desmond): Initialize pool group for each existing asset
        /// if they haven't been initialized
    }

    function disableDepositTerm(State storage self, uint term) external {
        require(self.isDepositTermEnabled[term], "DepositManager: term already disabled.");

        self.isDepositTermEnabled[term] = false;

        // Remove term from enabledDepositTerms
        for (uint i = 0; i < self.enabledDepositTerms.length; i++) {
            if (self.enabledDepositTerms[i] == term) {
                // Overwrite current term with the last term and shrink array size
                self.enabledDepositTerms[i] = self.enabledDepositTerms[self.enabledDepositTerms.length - 1];
                delete self.enabledDepositTerms[self.enabledDepositTerms.length - 1];
                self.enabledDepositTerms.length--;
            }
        }
    }
}
