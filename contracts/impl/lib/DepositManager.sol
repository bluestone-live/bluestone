pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import './Configuration.sol';
import './LiquidityPools.sol';
import './LoanManager.sol';
import './AccountManager.sol';
import '../../lib/DateTime.sol';
import '../../lib/FixedMath.sol';

library DepositManager {
    using Configuration for Configuration.State;
    using LiquidityPools for LiquidityPools.State;
    using LoanManager for LoanManager.State;
    using AccountManager for AccountManager.State;
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
        // total deposit weight history
        DepositInterestHistory depositInterestHistory;
    }

    struct DepositRecord {
        bytes32 depositId;
        address ownerAddress;
        address tokenAddress;
        uint256 depositTerm;
        uint256 depositAmount;
        uint256 poolId;
        uint256 createdAt;
        uint256 maturedAt;
        uint256 withdrewAt;
        uint256 weight;
        address distributorAddress;
        uint256 depositDistributorFeeRatio;
    }

    // Record interest index on a daily basis
    struct DepositInterestHistory {
        /// Each interest index corresponds to a snapshot of a particular pool state
        /// before updating deposit maturity of a PoolGroup.
        ///
        /// depositInterest = loanInterest * depositWeight / totalDepositWeight * (1 - protocolReserveRatio)
        /// depositWeight refers to weight in deposit record

        // days number -> total deposit weight
        mapping(uint256 => uint256) totalDepositWeightByDay;
        // days number -> total deposit interests
        mapping(uint256 => uint256) totalInterestByDay;
        uint256 lastDay;
    }

    event DepositSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        uint256 amount
    );
    event WithdrawSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        uint256 amount
    );

    struct DepositRecordListView {
        bytes32[] depositIdList;
        address[] tokenAddressList;
        uint256[] depositTermList;
        uint256[] depositAmountList;
        uint256[] createdAtList;
        uint256[] maturedAtList;
        uint256[] withdrewAtList;
    }

    struct DepositParameters {
        address tokenAddress;
        uint256 depositAmount;
        uint256 depositTerm;
        address distributorAddress;
        uint256 depositDistributorFeeRatio;
    }

    function enableDepositTerm(
        State storage self,
        LiquidityPools.State storage liquidityPools,
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
        LiquidityPools.State storage liquidityPools,
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
        LiquidityPools.State storage liquidityPools
    ) external {
        /// Ensure deposit maturity update only triggers once in a day by checking current
        /// timestamp is greater than the timestamp of last update (in day unit).
        require(
            DateTime.toDays(now) >
                DateTime.toDays(self.lastDepositMaturityUpdatedAt),
            'Cannot update multiple times within the same day.'
        );

        for (uint256 i = 0; i < self.allDepositTokenAddressList.length; i++) {
            address tokenAddress = self.allDepositTokenAddressList[i];

            for (uint256 j = 0; j < self.allDepositTermList.length; j++) {
                uint256 poolIndex = 0;

                (, , , uint256 loanInterest, uint256 totalDepositWeight) = liquidityPools
                    .getPool(tokenAddress, poolIndex);

                DepositInterestHistory storage history = self
                    .depositTokenByAddress[tokenAddress]
                    .depositInterestHistory;

                history.lastDay++;
                history.totalDepositWeightByDay[history
                    .lastDay] = totalDepositWeight;
                history.totalInterestByDay[history.lastDay] = loanInterest;

                liquidityPools.updatePoolGroupDepositMaturity(tokenAddress);
            }
        }

        self.lastDepositMaturityUpdatedAt = now;
    }

    function deposit(
        State storage self,
        LiquidityPools.State storage liquidityPools,
        AccountManager.State storage accountManager,
        Configuration.State storage configuration,
        DepositParameters storage depositParameters
    ) external returns (bytes32 depositId) {
        require(
            self.depositTokenByAddress[depositParameters.tokenAddress]
                .isEnabled,
            'DepositManager: invalid deposit token'
        );

        require(
            self.isDepositTermEnabled[depositParameters.depositTerm],
            'DepositManager: invalid deposit term'
        );

        require(
            depositParameters.distributorAddress != address(0),
            'DepositManager: invalid distributor address'
        );

        require(
            depositParameters.depositDistributorFeeRatio <=
                configuration.maxDepositDistributorFeeRatio,
            'DepositManager: invalid deposit distributor fee ratio'
        );

        address accountAddress = msg.sender;

        uint256 depositWeight = configuration.interestModel.getDepositWeight(
            depositParameters.depositAmount,
            depositParameters.depositTerm
        );

        uint256 poolId = liquidityPools.addDepositToPool(
            depositParameters.tokenAddress,
            depositParameters.depositAmount,
            depositWeight
        );

        self.numDeposits++;

        // Compute a hash as deposit ID
        bytes32 currDepositId = keccak256(
            abi.encode(accountAddress, poolId, self.numDeposits)
        );

        uint256 createdAt = now;
        uint256 maturedAt = createdAt +
            DateTime.secondsUntilMidnight(createdAt) +
            depositParameters.depositTerm *
            DateTime.dayInSeconds();

        self.depositRecordById[currDepositId] = DepositRecord({
            depositId: currDepositId,
            ownerAddress: accountAddress,
            tokenAddress: depositParameters.tokenAddress,
            depositTerm: depositParameters.depositTerm,
            depositAmount: depositParameters.depositAmount,
            poolId: poolId,
            createdAt: createdAt,
            maturedAt: maturedAt,
            withdrewAt: 0,
            weight: depositWeight,
            distributorAddress: depositParameters.distributorAddress,
            depositDistributorFeeRatio: depositParameters
                .depositDistributorFeeRatio
        });

        // Transfer token from user to protocol (`this` refers to Protocol contract)
        ERC20(depositParameters.tokenAddress).safeTransferFrom(
            accountAddress,
            address(this),
            depositParameters.depositAmount
        );

        accountManager.addToAccountGeneralStat(
            accountAddress,
            'totalDeposits',
            1
        );
        accountManager.addToAccountTokenStat(
            accountAddress,
            depositParameters.tokenAddress,
            'totalDeposits',
            1
        );
        accountManager.addToAccountTokenStat(
            accountAddress,
            depositParameters.tokenAddress,
            'totalDepositAmount',
            depositParameters.depositAmount
        );

        self.depositIdsByAccountAddress[accountAddress].push(currDepositId);
        emit DepositSucceed(
            accountAddress,
            currDepositId,
            depositParameters.depositAmount
        );

        return currDepositId;
    }

    function withdraw(
        State storage self,
        Configuration.State storage configuration,
        bytes32 depositId
    ) external returns (uint256 withdrewAmount) {
        DepositRecord storage depositRecord = self.depositRecordById[depositId];

        require(
            depositRecord.tokenAddress != address(0),
            'DepositManager: invalid deposit ID'
        );

        require(
            configuration.protocolAddress != address(0),
            'DepositManager: protocolAddress is not set'
        );

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
        uint256 totalInterest = _getInterestFromDaysAgo(
            self,
            tokenAddress,
            depositRecord.weight,
            numDaysAgo
        );

        uint256 depositDistributorFee = totalInterest.mulFixed(
            depositRecord.depositDistributorFeeRatio
        );

        /// totalInterest = interestForDepositor + interestForProtocol + depositDistributorFee + loanDistributorFee
        /// The loanDistributorFee has already sent in repay or liquidate process
        uint256 interestForProtocol = totalInterest.mulFixed(
            configuration.protocolReserveRatio
        );

        uint256 interestForDepositor = totalInterest
            .sub(depositDistributorFee)
            .sub(interestForProtocol);

        uint256 depositPlusInterestAmount = depositRecord.depositAmount.add(
            interestForDepositor
        );

        depositRecord.withdrewAt = now;

        // Transfer deposit distributor fee to distributor if distributor set
        if (depositRecord.distributorAddress != address(this)) {
            ERC20(tokenAddress).safeTransfer(
                depositRecord.distributorAddress,
                depositDistributorFee
            );
        }

        // Transfer protocol reserve to protocol address
        ERC20(tokenAddress).safeTransfer(
            configuration.protocolAddress,
            interestForProtocol
        );

        // Transfer deposit plus interest to depositor
        ERC20(tokenAddress).safeTransfer(
            accountAddress,
            depositPlusInterestAmount
        );

        emit WithdrawSucceed(
            accountAddress,
            depositId,
            depositPlusInterestAmount
        );

        return depositPlusInterestAmount;
    }

    function earlyWithdraw(
        State storage self,
        LiquidityPools.State storage liquidityPools,
        bytes32 depositId
    ) external returns (uint256 withdrewAmount) {
        DepositRecord storage depositRecord = self.depositRecordById[depositId];
        address tokenAddress = depositRecord.tokenAddress;

        require(
            self.depositTokenByAddress[tokenAddress].isEnabled,
            'DepositManager: invalid deposit token'
        );

        require(
            msg.sender == depositRecord.ownerAddress,
            'DepositManager: invalid owner'
        );

        require(
            isDepositEarlyWithdrawable(self, liquidityPools, depositId),
            'DepositManager: deposit is not early withdrawable'
        );

        liquidityPools.subtractDepositFromPool(
            depositRecord.tokenAddress,
            depositRecord.depositAmount,
            depositRecord.weight,
            depositRecord.poolId
        );

        depositRecord.withdrewAt = now;

        ERC20(depositRecord.tokenAddress).safeTransfer(
            msg.sender,
            depositRecord.depositAmount
        );

        emit WithdrawSucceed(
            msg.sender,
            depositRecord.depositId,
            depositRecord.depositAmount
        );

        return depositRecord.depositAmount;
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

    function getDepositRecordById(State storage self, bytes32 depositId)
        external
        view
        returns (
            address tokenAddress,
            uint256 depositTerm,
            uint256 depositAmount,
            uint256 poolId,
            uint256 createdAt,
            uint256 maturedAt,
            uint256 withdrewAt,
            bool isMatured,
            bool isWithdrawn
        )
    {
        DepositRecord memory depositRecord = self.depositRecordById[depositId];

        require(
            depositRecord.tokenAddress != address(0),
            'DepositManager: Deposit ID is invalid'
        );

        return (
            depositRecord.tokenAddress,
            depositRecord.depositTerm,
            depositRecord.depositAmount,
            depositRecord.poolId,
            depositRecord.createdAt,
            depositRecord.maturedAt,
            depositRecord.withdrewAt,
            now >= depositRecord.maturedAt,
            depositRecord.withdrewAt != 0
        );
    }

    function getDepositInterestById(
        State storage self,
        LiquidityPools.State storage liquidityPools,
        Configuration.State storage configuration,
        bytes32 depositId
    ) external view returns (uint256 interest) {
        DepositRecord memory depositRecord = self.depositRecordById[depositId];
        require(
            depositRecord.tokenAddress != address(0),
            'DepositManager: Deposit ID is invalid'
        );

        uint256 originalInterest;

        /// if deposit was matured, get interest index from history
        /// otherwise calculate by this formula: interestIndex = loanInterest / totalDeposit
        if (depositRecord.maturedAt < now) {
            originalInterest = _getInterestFromDaysAgo(
                self,
                depositRecord.tokenAddress,
                depositRecord.weight,
                DateTime.toDays(now - depositRecord.maturedAt)
            );
        } else {
            (, , , uint256 loanInterest, uint256 totalDepositWeight) = liquidityPools
                .getPoolById(depositRecord.tokenAddress, depositRecord.poolId);

            originalInterest = loanInterest
                .mulFixed(depositRecord.weight)
                .divFixed(totalDepositWeight);
        }
        return
            originalInterest.sub(
                originalInterest.mulFixed(configuration.protocolReserveRatio)
            );
    }

    function getDepositRecordsByAccount(State storage self, address account)
        external
        view
        returns (
            bytes32[] memory depositIdList,
            address[] memory tokenAddressList,
            uint256[] memory depositTermList,
            uint256[] memory depositAmountList,
            uint256[] memory createdAtList,
            uint256[] memory maturedAtList,
            uint256[] memory withdrewAtList
        )
    {
        DepositRecordListView memory depositRecordListViewObject;
        depositRecordListViewObject.depositIdList = self
            .depositIdsByAccountAddress[account];
        if (depositRecordListViewObject.depositIdList.length != 0) {
            depositRecordListViewObject.tokenAddressList = new address[](
                depositRecordListViewObject.depositIdList.length
            );
            depositRecordListViewObject.depositTermList = new uint256[](
                depositRecordListViewObject.depositIdList.length
            );
            depositRecordListViewObject.depositAmountList = new uint256[](
                depositRecordListViewObject.depositIdList.length
            );
            depositRecordListViewObject.createdAtList = new uint256[](
                depositRecordListViewObject.depositIdList.length
            );
            depositRecordListViewObject.maturedAtList = new uint256[](
                depositRecordListViewObject.depositIdList.length
            );
            depositRecordListViewObject.withdrewAtList = new uint256[](
                depositRecordListViewObject.depositIdList.length
            );
            for (
                uint256 i = 0;
                i < depositRecordListViewObject.depositIdList.length;
                i++
            ) {
                DepositRecord memory depositRecord = self
                    .depositRecordById[depositRecordListViewObject
                    .depositIdList[i]];
                depositRecordListViewObject.tokenAddressList[i] = depositRecord
                    .tokenAddress;
                depositRecordListViewObject.depositTermList[i] = depositRecord
                    .depositTerm;
                depositRecordListViewObject.depositAmountList[i] = depositRecord
                    .depositAmount;
                depositRecordListViewObject.createdAtList[i] = depositRecord
                    .createdAt;
                depositRecordListViewObject.maturedAtList[i] = depositRecord
                    .maturedAt;
                depositRecordListViewObject.withdrewAtList[i] = depositRecord
                    .withdrewAt;

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

    function isDepositEarlyWithdrawable(
        State storage self,
        LiquidityPools.State storage liquidityPools,
        bytes32 depositId
    ) public view returns (bool isEarlyWithdrawable) {
        DepositRecord memory depositRecord = self.depositRecordById[depositId];

        if (
            depositRecord.tokenAddress == address(0) ||
            depositRecord.withdrewAt != 0 ||
            depositRecord.maturedAt <= now
        ) {
            return false;
        }

        (, , uint256 availableAmount, , ) = liquidityPools.getPoolById(
            depositRecord.tokenAddress,
            depositRecord.poolId
        );

        return availableAmount >= depositRecord.depositAmount;
    }

    function _getInterestFromDaysAgo(
        State storage self,
        address tokenAddress,
        uint256 depositWeight,
        uint256 numDaysAgo
    ) internal view returns (uint256 interest) {
        DepositInterestHistory storage history = self
            .depositTokenByAddress[tokenAddress]
            .depositInterestHistory;

        uint256 totalDepositWeight = history.totalDepositWeightByDay[history
            .lastDay
            .sub(numDaysAgo)];

        if (totalDepositWeight == 0) {
            return 0;
        }

        uint256 totalInterest = history.totalInterestByDay[history.lastDay.sub(
            numDaysAgo
        )];

        // InterestPerDepositRecord = totalInterest * depositWeight / totalDepositWeight
        return
            totalInterest.mulFixed(depositWeight.divFixed(totalDepositWeight));
    }

}
