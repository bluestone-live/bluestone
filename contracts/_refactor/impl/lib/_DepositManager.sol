pragma solidity ^0.5.0;

import "./_LiquidityPools.sol";


// TODO(desmond): remove `_` after contract refactor is complete.
library _DepositManager {
    using _LiquidityPools for _LiquidityPools.State;

    struct State {
        /// Includes enabled and disabled desposit terms.
        /// We need to keep disabled deposit terms for deposit maturity update.
        uint[] allDepositTermList;

        uint[] enabledDepositTermList;

        // Deposit term -> has been enabled once?
        mapping(uint => bool) isDepositTermInitialized;

        // Deposit term -> enabled?
        mapping(uint => bool) isDepositTermEnabled;

        /// Include enabled and disabled deposit tokens.
        /// We need to keep disabled deposit tokens for deposit maturity update.
        address[] allDepositTokenAddressList;

        address[] enabledDepositTokenAddressList;

        // Token address -> DepositToken
        mapping(address => DepositToken) depositTokenByAddress;
    }

    // Hold relavent information about a deposit token
    struct DepositToken {
        // Only enabled token can perform deposit-related transactions
        bool isEnabled;

        // deposit term -> interest index history
        mapping(uint => InterestIndexHistory) interestIndexHistoryByTerm;
    }

    // Record interest index on a daily basis
    struct InterestIndexHistory {
        /// Each interest index corresponds to a snapshot of a particular pool state
        /// before updating deposit maturity of a PoolGroup.
        ///
        /// depositInterest = loanInterest * (deposit / totalDeposit) * (1 - protocolReserveRatio)
        /// And interestIndex here refers to `loanInterest / totalDeposit`.
        mapping(uint => uint) interestIndexPerDay;
        uint lastDay;
    }

    function enableDepositTerm(
        State storage self,
        _LiquidityPools.State storage liquidityPools,
        uint term
    )
        external
    {
        require(!self.isDepositTermEnabled[term], "DepositManager: term already enabled");

        self.isDepositTermEnabled[term] = true;
        self.enabledDepositTermList.push(term);

        // Only add this deposit term if it has not been enabled before
        if (!self.isDepositTermInitialized[term]) {
            self.allDepositTermList.push(term);
            self.isDepositTermInitialized[term] = true;
        }

        // Initialize pool group for each existing token if they haven't been initialized
        for (uint i = 0; i < self.enabledDepositTokenAddressList.length; i++) {
            address tokenAddress = self.enabledDepositTokenAddressList[i];
            liquidityPools.initPoolGroupIfNeeded(tokenAddress, term);
        }
    }

    function disableDepositTerm(State storage self, uint term) external {
        require(self.isDepositTermEnabled[term], "DepositManager: term already disabled.");

        self.isDepositTermEnabled[term] = false;

        // Remove term from enabledDepositTermList
        for (uint i = 0; i < self.enabledDepositTermList.length; i++) {
            if (self.enabledDepositTermList[i] == term) {
                uint numDepositTerms = self.enabledDepositTermList.length;
                uint lastDepositTerm = self.enabledDepositTermList[numDepositTerms - 1];

                // Overwrite current term with the last term
                self.enabledDepositTermList[i] = lastDepositTerm;

                // Shrink array size
                delete self.enabledDepositTermList[numDepositTerms - 1];
                self.enabledDepositTermList.length--;
            }
        }
    }

    function enableDepositToken(
        State storage self,
        _LiquidityPools.State storage liquidityPools,
        address tokenAddress
    )
        external
    {
        DepositToken storage depositToken = self.depositTokenByAddress[tokenAddress];

        require(!depositToken.isEnabled, "DepositManager: token already enabled");

        depositToken.isEnabled = true;
        self.allDepositTokenAddressList.push(tokenAddress);
        self.enabledDepositTokenAddressList.push(tokenAddress);

        // Initialize pool groups if they haven't been initialized
        for (uint i = 0; i < self.enabledDepositTermList.length; i++) {
            uint depositTerm = self.enabledDepositTermList[i];
            liquidityPools.initPoolGroupIfNeeded(tokenAddress, depositTerm);
        }
    }

    function disableDepositToken(State storage self, address tokenAddress) external {
        DepositToken storage depositToken = self.depositTokenByAddress[tokenAddress];

        require(depositToken.isEnabled, "DepositManager: token already disabled");

        depositToken.isEnabled = false;

        // Remove tokenAddress from enabledDepositTokenAddressList
        for (uint i = 0; i < self.enabledDepositTokenAddressList.length; i++) {
            if (self.enabledDepositTokenAddressList[i] == tokenAddress) {
                uint numDepositTokens = self.enabledDepositTokenAddressList.length;
                address lastDepositTokenAddress = self.enabledDepositTokenAddressList[numDepositTokens - 1];

                // Overwrite current tokenAddress with the last tokenAddress
                self.enabledDepositTokenAddressList[i] = lastDepositTokenAddress;

                // Shrink array size
                delete self.enabledDepositTokenAddressList[numDepositTokens - 1];
                self.enabledDepositTokenAddressList.length--;
            }
        }
    }

    function getDepositTokens(
        State storage self
    )
        external
        view
        returns (
            address[] memory depositTokenAddressList,
            bool[] memory isEnabledList
        )
    {
        uint numDepositTokens = self.allDepositTokenAddressList.length;
        address[] memory _depositTokenAddressList = new address[](numDepositTokens);
        bool[] memory _isEnabledList = new bool[](numDepositTokens);

        for (uint i = 0; i < numDepositTokens; i++) {
            address tokenAddress = self.allDepositTokenAddressList[i];
            _depositTokenAddressList[i] = tokenAddress;
            _isEnabledList[i] = self.depositTokenByAddress[tokenAddress].isEnabled;
        }

        return (_depositTokenAddressList, _isEnabledList);
    }
}
