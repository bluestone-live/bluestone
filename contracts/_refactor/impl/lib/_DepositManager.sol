pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import './_Configuration.sol';
import './_LiquidityPools.sol';
import './_LoanManager.sol';
import '../../lib/DateTime.sol';
import '../../lib/FixedMath.sol';

// TODO(desmond): remove `_` after contract refactor is complete.
library _DepositManager {
    using _Configuration for _Configuration.State;
    using _LiquidityPools for _LiquidityPools.State;
    using _LoanManager for _LoanManager.State;
    using SafeERC20 for ERC20;
    using SafeMath for uint256;
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
        // ID -> DepositRecord
        mapping(bytes32 => DepositRecord) depositRecordById;
        // When was the last time deposit maturity updated
        uint256 lastDepositMaturityUpdatedAt;
        uint256 numDeposits;

        // AccountAddress -> DepositIds
        mapping(address => bytes32[]) depositIdsByAccountAddress;
    }

    // Hold relavent information about a deposit token
    struct DepositToken {
        // Only enabled token can perform deposit-related transactions
        bool isEnabled;
        // deposit term -> interest index history
        mapping(uint256 => InterestIndexHistory) interestIndexHistoryByTerm;
    }

    // TODO(desmond): merge with D378
    struct DepositRecord {
        bool isValid;
        bytes32 depositId;
        address ownerAddress;
        address tokenAddress;
        uint256 depositTerm;
        uint256 depositAmount;
        uint256 poolId;
        uint256 createdAt;
        uint256 maturedAt;
        uint256 withdrewAt;
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
    event WithdrawSucceed(address indexed accountAddress, bytes32 depositId);

    struct DepositRecordListView {
        bytes32[] depositIdList;
        address[] tokenAddressList;
        uint[] depositTermList;
        uint[] depositAmountList;
        uint[] createdAtList;
        uint[] maturedAtList;
        uint[] withdrewAtList;
    }

    function enableDepositTerm(
        State storage self,
        _LiquidityPools.State storage liquidityPools,
        uint256 term
    )
        external
    {
        require(
            !self.isDepositTermEnabled[term],
            "DepositManager: term already enabled"
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
            "DepositManager: term already disabled."
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

        self.numDeposits++;

        // Compute a hash as deposit ID
        bytes32 currDepositId = keccak256(
            abi.encode(accountAddress, poolId, self.numDeposits)
        );

        uint256 createdAt = now;
        uint256 maturedAt = createdAt +
            DateTime.secondsUntilMidnight(createdAt) +
            depositTerm *
            DateTime.dayInSeconds();

        // TODO(desmond): complete deposit record after D378 is done
        self.depositRecordById[currDepositId] = DepositRecord({
            isValid: true,
            depositId: currDepositId,
            ownerAddress: accountAddress,
            tokenAddress: tokenAddress,
            depositTerm: depositTerm,
            depositAmount: depositAmount,
            poolId: poolId,
            createdAt: createdAt,
            maturedAt: maturedAt,
            withdrewAt: 0
        });

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

    function withdraw(
        State storage self,
        _Configuration.State storage configuration,
        bytes32 depositId
    ) external returns (uint256 withdrewAmount) {
        // TODO(desmond): verify user actions are locked

        DepositRecord storage depositRecord = self.depositRecordById[depositId];

        require(depositRecord.isValid, 'DepositManager: invalid deposit ID');

        address tokenAddress = depositRecord.tokenAddress;
        address accountAddress = msg.sender;

        require(
            self.depositTokenByAddress[tokenAddress].isEnabled,
            'DepositManager: invalid deposit token'
        );

        require(
            accountAddress == depositRecord.ownerAddress,
            'DepositManager: invalid owner'
        );
        require(
            depositRecord.withdrewAt == 0,
            'DepositManager: deposit is withdrawn'
        );
        require(
            depositRecord.maturedAt <= now,
            'DepositManager: deposit is not matured'
        );

        uint256 numDaysAgo = DateTime.toDays(now - depositRecord.maturedAt);

        uint256 interestIndex = _getInterestIndexFromDaysAgo(
            self,
            tokenAddress,
            depositRecord.depositTerm,
            numDaysAgo
        );

        uint256 totalInterests = depositRecord.depositAmount.mulFixed(
            interestIndex
        );
        uint256 interestsForProtocol = totalInterests.mulFixed(
            configuration.protocolReserveRatio
        );
        uint256 interestsForDepositor = totalInterests.sub(
            interestsForProtocol
        );
        uint256 depositPlusInterestAmount = depositRecord.depositAmount.add(
            interestsForDepositor
        );

        depositRecord.withdrewAt = now;

        // Transfer deposit plus interest to depositor
        ERC20(tokenAddress).safeTransfer(
            accountAddress,
            depositPlusInterestAmount
        );

        emit WithdrawSucceed(accountAddress, depositId);

        return depositPlusInterestAmount;
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

    function _getInterestIndexFromDaysAgo(
        State storage self,
        address tokenAddress,
        uint256 depositTerm,
        uint256 numDaysAgo
    ) internal view returns (uint256 interestIndex) {
        InterestIndexHistory storage history = self
            .depositTokenByAddress[tokenAddress]
            .interestIndexHistoryByTerm[depositTerm];

        return history.interestIndexByDay[history.lastDay.sub(numDaysAgo)];
    }

    function getDepositById(State storage self, bytes32 depositId)
        external
        view
        returns (
            address tokenAddress,
            uint depositTerm,
            uint depositAmount,
            uint interestIndex,
            uint poolId,
            uint createdAt,
            uint maturedAt,
            uint withdrewAt,
            bool isMatured,
            bool isWithdrawn
        )
    {
        DepositRecord memory depositRecord = self.depositRecordById[depositId];

        require(depositRecord.tokenAddress != address(0), "DepositManager: Deposit ID is invalid");

        // TODO(ZhangRGK): interest index depends on pool groups
        interestIndex = 0;

        return (
            depositRecord.tokenAddress,
            depositRecord.depositTerm,
            depositRecord.depositAmount,
            interestIndex,
            depositRecord.poolId,
            depositRecord.createdAt,
            depositRecord.maturedAt,
            depositRecord.withdrewAt,
            now >= depositRecord.maturedAt,
            depositRecord.withdrewAt != 0
        );
    }

    function getDepositRecordsByAccount(State storage self, address account)
        external
        view
        returns (
            bytes32[] memory depositIdList,
            address[] memory tokenAddressList,
            uint[] memory depositTermList,
            uint[] memory depositAmountList,
            uint[] memory createdAtList,
            uint[] memory maturedAtList,
            uint[] memory withdrewAtList
        )
    {
        DepositRecordListView memory depositRecordListViewObject;
        depositRecordListViewObject.depositIdList = self.depositIdsByAccountAddress[account];
        if (depositRecordListViewObject.depositIdList.length != 0) {
            for (uint i = 0; i < depositRecordListViewObject.depositIdList.length; i++) {
                DepositRecord memory depositRecord = self.depositRecordsByDepositId[depositRecordListViewObject.depositIdList[i]];
                depositRecordListViewObject.tokenAddressList[i] = depositRecord.tokenAddress;
                depositRecordListViewObject.depositTermList[i] = depositRecord.depositTerm;
                depositRecordListViewObject.depositAmountList[i] = depositRecord.depositAmount;
                depositRecordListViewObject.createdAtList[i] = depositRecord.createdAt;
                depositRecordListViewObject.maturedAtList[i] = depositRecord.maturedAt;
                depositRecordListViewObject.withdrewAtList[i] = depositRecord.withdrewAt;

            }
        }
        return (
            depositRecordListViewObject.depositIdList,
            depositRecordListViewObject.tokenAddressList,
            depositRecordListViewObject.depositTermList,
            depositRecordListViewObject.depositAmountList,
            depositRecordListViewObject.createdAtList,
            depositRecordListViewObject.maturedAtList,
            depositRecordListViewObject.withdrewAtList
        );
    }
}
