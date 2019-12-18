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
        uint256[] enabledDepositTermList;
        address[] enabledDepositTokenAddressList;
        // Deposit term -> enabled?
        mapping(uint256 => bool) isDepositTermEnabled;
        // Deposit token -> enabled?
        mapping(address => bool) isDepositTokenEnabled;
        // ID -> DepositRecord
        mapping(bytes32 => DepositRecord) depositRecordById;
        uint256 numDeposits;
        // AccountAddress -> DepositIds
        mapping(address => bytes32[]) depositIdsByAccountAddress;
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

        // Update pool group for each existing token if needed
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
        require(
            !self.isDepositTokenEnabled[tokenAddress],
            'DepositManager: token already enabled'
        );

        self.isDepositTokenEnabled[tokenAddress] = true;
        self.enabledDepositTokenAddressList.push(tokenAddress);

        // Update pool groups if needed
        for (uint256 i = 0; i < self.enabledDepositTermList.length; i++) {
            uint256 depositTerm = self.enabledDepositTermList[i];
            liquidityPools.initPoolGroupIfNeeded(tokenAddress, depositTerm);
        }
    }

    function disableDepositToken(State storage self, address tokenAddress)
        external
    {
        require(
            self.isDepositTokenEnabled[tokenAddress],
            'DepositManager: token already disabled'
        );

        self.isDepositTokenEnabled[tokenAddress] = false;

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

    function deposit(
        State storage self,
        LiquidityPools.State storage liquidityPools,
        AccountManager.State storage accountManager,
        Configuration.State storage configuration,
        DepositParameters storage depositParameters
    ) external returns (bytes32 depositId) {
        require(
            self.isDepositTokenEnabled[depositParameters.tokenAddress],
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

        address accountAddress = msg.sender;

        uint256 depositWeight = configuration.interestModel.getDepositWeight(
            depositParameters.depositAmount,
            depositParameters.depositTerm
        );

        uint256 poolId = liquidityPools.addDepositToPool(
            depositParameters.tokenAddress,
            depositParameters.depositAmount,
            depositParameters.depositTerm,
            depositWeight,
            configuration.maxDepositDistributorFeeRatio,
            configuration.maxLoanDistributorFeeRatio,
            configuration.protocolReserveRatio
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
            distributorAddress: depositParameters.distributorAddress
        });

        // Transfer token from user to protocol (`this` refers to Protocol contract)
        ERC20(depositParameters.tokenAddress).safeTransferFrom(
            accountAddress,
            address(this),
            depositParameters.depositAmount
        );

        accountManager.addToAccountGeneralStat(
            accountAddress,
            'numberOfDeposits',
            1
        );
        accountManager.addToAccountTokenStat(
            accountAddress,
            depositParameters.tokenAddress,
            'numberOfDeposits',
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
        LiquidityPools.State storage liquidityPools,
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
            self.isDepositTokenEnabled[tokenAddress],
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

        (uint256 interestForDepositor, uint256 interestForDepositDistributor, , uint256 interestForProtocolReserve) = getInterestDistributionByDepositId(
            self,
            liquidityPools,
            depositId
        );

        uint256 depositPlusInterestAmount = depositRecord.depositAmount.add(
            interestForDepositor
        );

        depositRecord.withdrewAt = now;

        if (depositRecord.distributorAddress != address(this)) {
            // Transfer deposit distributor fee to distributor
            ERC20(tokenAddress).safeTransfer(
                depositRecord.distributorAddress,
                interestForDepositDistributor
            );
        }

        // Transfer protocol reserve to protocol address
        ERC20(tokenAddress).safeTransfer(
            configuration.protocolAddress,
            interestForProtocolReserve
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
            self.isDepositTokenEnabled[tokenAddress],
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

    function getInterestDistributionByDepositId(
        State storage self,
        LiquidityPools.State storage liquidityPools,
        bytes32 depositId
    )
        public
        view
        returns (
            uint256 interestForDepositor,
            uint256 interestForDepositDistributor,
            uint256 interestForLoanDistributor,
            uint256 interestForProtocolReserve
        )
    {
        DepositRecord memory depositRecord = self.depositRecordById[depositId];

        require(
            depositRecord.tokenAddress != address(0),
            'DepositManager: Deposit ID is invalid'
        );

        (, , uint256 loanInterest, uint256 totalDepositWeight, uint256 depositDistributorFeeRatio, uint256 loanDistributorFeeRatio, uint256 protocolReserveRatio) = liquidityPools
            .getPoolById(depositRecord.tokenAddress, depositRecord.poolId);

        if (totalDepositWeight == 0) {
            return (0, 0, 0, 0);
        }

        uint256 totalInterest = loanInterest.mulFixed(
            depositRecord.weight.divFixed(totalDepositWeight)
        );

        interestForDepositDistributor = totalInterest.mulFixed(
            depositDistributorFeeRatio
        );

        interestForLoanDistributor = totalInterest.mulFixed(
            loanDistributorFeeRatio
        );

        interestForProtocolReserve = totalInterest.mulFixed(
            protocolReserveRatio
        );

        interestForDepositor = totalInterest
            .sub(interestForDepositDistributor)
            .sub(interestForLoanDistributor)
            .sub(interestForProtocolReserve);

        return (
            interestForDepositor,
            interestForDepositDistributor,
            interestForLoanDistributor,
            interestForProtocolReserve
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

        (, uint256 availableAmount, , , , , ) = liquidityPools.getPoolById(
            depositRecord.tokenAddress,
            depositRecord.poolId
        );

        return availableAmount >= depositRecord.depositAmount;
    }
}
