pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import './_LiquidityPools.sol';
import './_LoanManager.sol';
import '../../lib/DateTime.sol';
import '../../lib/FixedMath.sol';

// TODO(desmond): remove `_` after contract refactor is complete.
library _DepositManager {
    using _LiquidityPools for _LiquidityPools.State;
    using _LoanManager for _LoanManager.State;
    using SafeERC20 for ERC20;
    using FixedMath for uint256;

    struct State {
        /// Includes enabled and disabled desposit terms.
        /// We need to keep disabled deposit terms for deposit maturity update.
        uint256[] allDepositTermList;
        uint256[] enabledDepositTermList;
        // Deposit term -> has been enabled once?
        mapping(uint256 => bool) isDepositTermInitialized;
        // Deposit term -> enabled?
        mapping(uint256 => bool) isDepositTermEnabled;
        /// Include enabled and disabled deposit tokens.
        /// We need to keep disabled deposit tokens for deposit maturity update.
        address[] allDepositTokenAddressList;
        address[] enabledDepositTokenAddressList;
        // Token address -> DepositToken
        mapping(address => DepositToken) depositTokenByAddress;
        // When was the last time deposit maturity updated
        uint256 lastDepositMaturityUpdatedAt;
        uint256 numDeposits;
    }

    // Hold relavent information about a deposit token
    struct DepositToken {
        // Only enabled token can perform deposit-related transactions
        bool isEnabled;
        // deposit term -> interest index history
        mapping(uint256 => InterestIndexHistory) interestIndexHistoryByTerm;
    }

    // Record interest index on a daily basis
    struct InterestIndexHistory {
        /// Each interest index corresponds to a snapshot of a particular pool state
        /// before updating deposit maturity of a PoolGroup.
        ///
        /// depositInterest = loanInterest * (deposit / depositAmount) * (1 - protocolReserveRatio)
        /// And interestIndex here refers to `loanInterest / depositAmount`.
        mapping(uint256 => uint256) interestIndexByDay;
        uint256 lastDay;
    }

    event DepositSucceed(address indexed accountAddress, bytes32 depositId);

    function enableDepositTerm(
        State storage self,
        _LiquidityPools.State storage liquidityPools,
        uint256 term
    ) external {
        require(
            !self.isDepositTermEnabled[term],
            'DepositManager: term already enabled'
        );

        self.isDepositTermEnabled[term] = true;
        self.enabledDepositTermList.push(term);

        // Only add this deposit term if it has not been enabled before
        if (!self.isDepositTermInitialized[term]) {
            self.allDepositTermList.push(term);
            self.isDepositTermInitialized[term] = true;
        }

        // Initialize pool group for each existing token if they haven't been initialized
        for (
            uint256 i = 0;
            i < self.enabledDepositTokenAddressList.length;
            i++
        ) {
            address tokenAddress = self.enabledDepositTokenAddressList[i];
            liquidityPools.initPoolGroupIfNeeded(tokenAddress, term);
        }
    }

    function disableDepositTerm(State storage self, uint256 term) external {
        require(
            self.isDepositTermEnabled[term],
            'DepositManager: term already disabled.'
        );

        self.isDepositTermEnabled[term] = false;

        // Remove term from enabledDepositTermList
        for (uint256 i = 0; i < self.enabledDepositTermList.length; i++) {
            if (self.enabledDepositTermList[i] == term) {
                uint256 numDepositTerms = self.enabledDepositTermList.length;
                uint256 lastDepositTerm = self
                    .enabledDepositTermList[numDepositTerms - 1];

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
    ) external {
        DepositToken storage depositToken = self
            .depositTokenByAddress[tokenAddress];

        require(
            !depositToken.isEnabled,
            'DepositManager: token already enabled'
        );

        depositToken.isEnabled = true;
        self.allDepositTokenAddressList.push(tokenAddress);
        self.enabledDepositTokenAddressList.push(tokenAddress);

        // Initialize pool groups if they haven't been initialized
        for (uint256 i = 0; i < self.enabledDepositTermList.length; i++) {
            uint256 depositTerm = self.enabledDepositTermList[i];
            liquidityPools.initPoolGroupIfNeeded(tokenAddress, depositTerm);
        }
    }

    function disableDepositToken(State storage self, address tokenAddress)
        external
    {
        DepositToken storage depositToken = self
            .depositTokenByAddress[tokenAddress];

        require(
            depositToken.isEnabled,
            'DepositManager: token already disabled'
        );

        depositToken.isEnabled = false;

        // Remove tokenAddress from enabledDepositTokenAddressList
        for (
            uint256 i = 0;
            i < self.enabledDepositTokenAddressList.length;
            i++
        ) {
            if (self.enabledDepositTokenAddressList[i] == tokenAddress) {
                uint256 numDepositTokens = self
                    .enabledDepositTokenAddressList
                    .length;
                address lastDepositTokenAddress = self
                    .enabledDepositTokenAddressList[numDepositTokens - 1];

                // Overwrite current tokenAddress with the last tokenAddress
                self
                    .enabledDepositTokenAddressList[i] = lastDepositTokenAddress;

                // Shrink array size
                delete self.enabledDepositTokenAddressList[numDepositTokens -
                    1];
                self.enabledDepositTokenAddressList.length--;
            }
        }
    }

    function updateDepositMaturity(
        State storage self,
        _LiquidityPools.State storage liquidityPools,
        _LoanManager.State storage loanManager
    ) external {
        // TODO(desmond): verify user actions are locked after the method is implemented

        /// Ensure deposit maturity update only triggers once in a day by checking current
        /// timestamp is greater than the timestamp of last update (in day unit).
        require(
            DateTime.toDays(now) >
                DateTime.toDays(self.lastDepositMaturityUpdatedAt),
            'Cannot update multiple times within the same day.'
        );

        uint256[] memory loanTermList = loanManager.loanTermList;

        for (uint256 i = 0; i < self.allDepositTokenAddressList.length; i++) {
            address tokenAddress = self.allDepositTokenAddressList[i];

            for (uint256 j = 0; j < self.allDepositTermList.length; j++) {
                uint256 depositTerm = self.allDepositTermList[j];
                uint256 poolIndex = 0;

                (uint256 depositAmount, , , uint256 loanInterest) = liquidityPools
                    .getPool(tokenAddress, depositTerm, poolIndex);

                InterestIndexHistory storage history = self
                    .depositTokenByAddress[tokenAddress]
                    .interestIndexHistoryByTerm[depositTerm];

                uint256 interestIndex;

                if (depositAmount > 0) {
                    interestIndex = loanInterest.divFixed(depositAmount);
                } else {
                    interestIndex = 0;
                }

                // Add a new interest index
                history.lastDay++;
                history.interestIndexByDay[history.lastDay] = interestIndex;

                liquidityPools.updatePoolGroupDepositMaturity(
                    tokenAddress,
                    depositTerm,
                    loanTermList
                );
            }
        }

        self.lastDepositMaturityUpdatedAt = now;
    }

    function deposit(
        State storage self,
        _LiquidityPools.State storage liquidityPools,
        _LoanManager.State storage loanManager,
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositTerm
    ) external returns (bytes32 depositId) {
        // TODO(desmond): verify user actions not locked

        require(
            self.depositTokenByAddress[tokenAddress].isEnabled,
            'DepositManager: invalid deposit token'
        );

        require(
            self.isDepositTermEnabled[depositTerm],
            'DepositManager: invalid deposit term'
        );

        address accountAddress = msg.sender;

        uint256 poolId = liquidityPools.addDepositToPool(
            tokenAddress,
            depositAmount,
            depositTerm,
            loanManager.loanTermList
        );

        // TODO(desmond): save deposit record after D378 is done

        self.numDeposits++;

        // Compute a hash as deposit ID
        bytes32 currDepositId = keccak256(
            abi.encode(accountAddress, poolId, self.numDeposits)
        );

        // Transfer token from user to protocol (`this` refers to Protocol contract)
        ERC20(tokenAddress).safeTransferFrom(
            accountAddress,
            address(this),
            depositAmount
        );

        // TODO(desmond): increment stats

        emit DepositSucceed(accountAddress, currDepositId);

        return currDepositId;
    }

    function getDepositTokens(State storage self)
        external
        view
        returns (
            address[] memory depositTokenAddressList,
            bool[] memory isEnabledList
        )
    {
        uint256 numDepositTokens = self.allDepositTokenAddressList.length;
        address[] memory _depositTokenAddressList = new address[](
            numDepositTokens
        );
        bool[] memory _isEnabledList = new bool[](numDepositTokens);

        for (uint256 i = 0; i < numDepositTokens; i++) {
            address tokenAddress = self.allDepositTokenAddressList[i];
            _depositTokenAddressList[i] = tokenAddress;
            _isEnabledList[i] = self.depositTokenByAddress[tokenAddress]
                .isEnabled;
        }

        return (_depositTokenAddressList, _isEnabledList);
    }
}
