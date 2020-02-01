pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '../ERC20.sol';
import './Configuration.sol';
import './LiquidityPools.sol';
import './LoanManager.sol';
import '../../lib/DateTime.sol';
import '../../lib/SafeMath.sol';
import '../../lib/FixedMath.sol';
import '../../lib/SafeERC20.sol';
import '../../interface/IStruct.sol';

library DepositManager {
    using Configuration for Configuration.State;
    using LiquidityPools for LiquidityPools.State;
    using LoanManager for LoanManager.State;
    using SafeERC20 for ERC20;
    using SafeMath for uint256;
    using FixedMath for uint256;

    struct State {
        uint256[] depositTermList;
        address[] depositTokenAddressList;
        // Deposit term -> enabled?
        mapping(uint256 => bool) isDepositTermEnabled;
        // Deposit token -> enabled?
        mapping(address => bool) isDepositTokenEnabled;
        // ID -> DepositRecord
        mapping(bytes32 => IStruct.DepositRecord) depositRecordById;
        uint256 numDeposits;
        // AccountAddress -> DepositIds
        mapping(address => bytes32[]) depositIdsByAccountAddress;
    }

    event EnableDepositTermSucceed(address indexed adminAddress, uint256 term);
    event DisableDepositTermSucceed(address indexed adminAddress, uint256 term);
    event EnableDepositTokenSucceed(
        address indexed adminAddress,
        address tokenAddress
    );
    event DisableDepositTokenSucceed(
        address indexed adminAddress,
        address tokenAddress
    );
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
    event EarlyWithdrawSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        uint256 amount
    );

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
        self.depositTermList.push(term);

        /// Update pool group size for each existing token the new term is
        /// greater than the previous pool group size
        for (uint256 i = 0; i < self.depositTokenAddressList.length; i++) {
            address tokenAddress = self.depositTokenAddressList[i];
            liquidityPools.setPoolGroupSizeIfNeeded(tokenAddress, term);
        }

        emit EnableDepositTermSucceed(msg.sender, term);
    }

    function disableDepositTerm(State storage self, uint256 term) external {
        require(
            self.isDepositTermEnabled[term],
            'DepositManager: term already disabled'
        );

        self.isDepositTermEnabled[term] = false;

        // Remove term from depositTermList
        for (uint256 i = 0; i < self.depositTermList.length; i++) {
            if (self.depositTermList[i] == term) {
                uint256 numDepositTerms = self.depositTermList.length;
                uint256 lastDepositTerm = self.depositTermList[numDepositTerms -
                    1];

                // Overwrite current term with the last term
                self.depositTermList[i] = lastDepositTerm;

                // Shrink array size
                self.depositTermList.pop();
            }
        }

        emit DisableDepositTermSucceed(msg.sender, term);
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
        self.depositTokenAddressList.push(tokenAddress);

        /// Find the maximum deposit term and update pool group size
        /// for this token if needed
        uint256 maxDepositTerm;

        for (uint256 i = 0; i < self.depositTermList.length; i++) {
            uint256 depositTerm = self.depositTermList[i];

            if (depositTerm > maxDepositTerm) {
                maxDepositTerm = depositTerm;
            }
        }

        liquidityPools.setPoolGroupSizeIfNeeded(tokenAddress, maxDepositTerm);

        emit EnableDepositTokenSucceed(msg.sender, tokenAddress);
    }

    function disableDepositToken(State storage self, address tokenAddress)
        external
    {
        require(
            self.isDepositTokenEnabled[tokenAddress],
            'DepositManager: token already disabled'
        );

        self.isDepositTokenEnabled[tokenAddress] = false;

        // Remove tokenAddress from depositTokenAddressList
        for (uint256 i = 0; i < self.depositTokenAddressList.length; i++) {
            if (self.depositTokenAddressList[i] == tokenAddress) {
                // Swap the current token address and the last token address,
                // then decrease the array size by one to effectively remove
                // the disabled token address.
                uint256 numDepositTokens = self.depositTokenAddressList.length;
                address lastDepositTokenAddress = self
                    .depositTokenAddressList[numDepositTokens - 1];

                // Overwrite current tokenAddress with the last tokenAddress
                self.depositTokenAddressList[i] = lastDepositTokenAddress;

                // Shrink array size
                self.depositTokenAddressList.pop();

                break;
            }
        }

        emit DisableDepositTokenSucceed(msg.sender, tokenAddress);
    }

    function deposit(
        State storage self,
        LiquidityPools.State storage liquidityPools,
        Configuration.State storage configuration,
        IStruct.DepositParameters calldata depositParameters
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

        address payable accountAddress = msg.sender;

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

        self.depositRecordById[currDepositId] = IStruct.DepositRecord({
            depositId: currDepositId,
            ownerAddress: accountAddress,
            tokenAddress: depositParameters.tokenAddress,
            depositTerm: depositParameters.depositTerm,
            depositAmount: depositParameters.depositAmount,
            poolId: poolId,
            createdAt: createdAt,
            withdrewAt: 0,
            weight: depositWeight,
            distributorAddress: depositParameters.distributorAddress
        });

        // Transfer token from user to protocol (`this` refers to Protocol contract)
        if (address(depositParameters.tokenAddress) == address(1)) {
            configuration.payableProxy.receiveETH.value(
                depositParameters.depositAmount
            )();
        } else {
            ERC20(address(depositParameters.tokenAddress)).safeTransferFrom(
                accountAddress,
                address(this),
                depositParameters.depositAmount
            );
        }

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
        IStruct.DepositRecord storage depositRecord = self
            .depositRecordById[depositId];

        require(
            depositRecord.tokenAddress != address(0),
            'DepositManager: invalid deposit ID'
        );

        require(
            configuration.interestReserveAddress != address(0),
            'DepositManager: interestReserveAddress is not set'
        );

        address tokenAddress = depositRecord.tokenAddress;
        address payable accountAddress = msg.sender;

        require(
            accountAddress == depositRecord.ownerAddress,
            'DepositManager: invalid owner'
        );
        require(
            depositRecord.withdrewAt == 0,
            'DepositManager: deposit is withdrawn'
        );
        require(
            depositRecord.poolId < DateTime.toDays(),
            'DepositManager: deposit is not matured'
        );

        (uint256 interestForDepositor, uint256 interestForDepositDistributor, , uint256 interestForProtocolReserve) = _getInterestDistributionByDepositId(
            self,
            liquidityPools,
            depositId
        );

        uint256 depositPlusInterestAmount = depositRecord.depositAmount.add(
            interestForDepositor
        );

        depositRecord.withdrewAt = now;

        if (tokenAddress == address(1)) {
            // Transfer deposit distributor fee to distributor if distributor set
            if (depositRecord.distributorAddress != address(this)) {
                configuration.payableProxy.sendETH(
                    depositRecord.distributorAddress,
                    interestForDepositDistributor
                );
            }
            // Transfer protocol reserve to interest reserve address
            configuration.payableProxy.sendETH(
                configuration.interestReserveAddress,
                interestForProtocolReserve
            );
            // Transfer deposit plus interest to depositor
            configuration.payableProxy.sendETH(
                accountAddress,
                depositPlusInterestAmount
            );
        } else {
            // Transfer deposit distributor fee to distributor if distributor set
            if (depositRecord.distributorAddress != address(this)) {
                ERC20(tokenAddress).safeTransfer(
                    depositRecord.distributorAddress,
                    interestForDepositDistributor
                );
            }

            // Transfer protocol reserve to interest reserve address
            ERC20(tokenAddress).safeTransfer(
                configuration.interestReserveAddress,
                interestForProtocolReserve
            );

            // Transfer deposit plus interest to depositor
            ERC20(tokenAddress).safeTransfer(
                accountAddress,
                depositPlusInterestAmount
            );
        }
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
        Configuration.State storage configuration,
        bytes32 depositId
    ) external returns (uint256 withdrewAmount) {
        IStruct.DepositRecord storage depositRecord = self
            .depositRecordById[depositId];

        require(
            msg.sender == depositRecord.ownerAddress,
            'DepositManager: invalid owner'
        );

        require(
            isDepositEarlyWithdrawable(self, liquidityPools, depositId),
            'DepositManager: cannot early withdraw'
        );

        liquidityPools.subtractDepositFromPool(
            depositRecord.tokenAddress,
            depositRecord.depositAmount,
            depositRecord.weight,
            depositRecord.poolId
        );

        depositRecord.withdrewAt = now;

        if (depositRecord.tokenAddress == address(1)) {
            configuration.payableProxy.sendETH(
                msg.sender,
                depositRecord.depositAmount
            );
        } else {
            ERC20(depositRecord.tokenAddress).safeTransfer(
                msg.sender,
                depositRecord.depositAmount
            );
        }

        emit EarlyWithdrawSucceed(
            msg.sender,
            depositRecord.depositId,
            depositRecord.depositAmount
        );

        return depositRecord.depositAmount;
    }

    function getDepositRecordById(
        State storage self,
        LiquidityPools.State storage liquidityPools,
        bytes32 depositId
    )
        public
        view
        returns (IStruct.GetDepositRecordResponse memory depositRecord)
    {
        IStruct.DepositRecord memory depositRecord = self
            .depositRecordById[depositId];

        require(
            depositRecord.tokenAddress != address(0),
            'DepositManager: invalid deposit ID'
        );

        (uint256 interestForDepositor, , , ) = _getInterestDistributionByDepositId(
            self,
            liquidityPools,
            depositId
        );

        IStruct.GetDepositRecordResponse memory depositRecordResponse = IStruct
            .GetDepositRecordResponse({
            depositId: depositId,
            tokenAddress: depositRecord.tokenAddress,
            depositTerm: depositRecord.depositTerm,
            depositAmount: depositRecord.depositAmount,
            poolId: depositRecord.poolId,
            interest: interestForDepositor,
            createdAt: depositRecord.createdAt,
            withdrewAt: depositRecord.withdrewAt,
            weight: depositRecord.weight
        });

        return depositRecordResponse;
    }

    function _getInterestDistributionByDepositId(
        State storage self,
        LiquidityPools.State storage liquidityPools,
        bytes32 depositId
    )
        internal
        view
        returns (
            uint256 interestForDepositor,
            uint256 interestForDepositDistributor,
            uint256 interestForLoanDistributor,
            uint256 interestForProtocolReserve
        )
    {
        IStruct.DepositRecord memory depositRecord = self
            .depositRecordById[depositId];

        require(
            depositRecord.tokenAddress != address(0),
            'DepositManager: invalid deposit ID'
        );

        IStruct.Pool memory pool = liquidityPools.getPoolById(
            depositRecord.tokenAddress,
            depositRecord.poolId
        );

        if (pool.totalDepositWeight == 0) {
            return (0, 0, 0, 0);
        }

        uint256 totalInterest = pool.loanInterest.mulFixed(
            depositRecord.weight.divFixed(pool.totalDepositWeight)
        );

        interestForDepositDistributor = totalInterest.mulFixed(
            pool.depositDistributorFeeRatio
        );

        interestForLoanDistributor = totalInterest.mulFixed(
            pool.loanDistributorFeeRatio
        );

        interestForProtocolReserve = totalInterest.mulFixed(
            pool.protocolReserveRatio
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

    function getDepositRecordsByAccount(
        State storage self,
        LiquidityPools.State storage liquidityPools,
        address accountAddress
    )
        external
        view
        returns (IStruct.GetDepositRecordResponse[] memory depositRecordList)
    {
        bytes32[] memory depositIdList = self
            .depositIdsByAccountAddress[accountAddress];

        depositRecordList = new IStruct.GetDepositRecordResponse[](
            depositIdList.length
        );

        for (uint256 i = 0; i < depositIdList.length; i++) {
            depositRecordList[i] = getDepositRecordById(
                self,
                liquidityPools,
                depositIdList[i]
            );
        }

        return depositRecordList;
    }

    function isDepositEarlyWithdrawable(
        State storage self,
        LiquidityPools.State storage liquidityPools,
        bytes32 depositId
    ) public view returns (bool isEarlyWithdrawable) {
        IStruct.DepositRecord memory depositRecord = self
            .depositRecordById[depositId];

        if (
            depositRecord.tokenAddress == address(0) ||
            depositRecord.withdrewAt != 0 ||
            depositRecord.poolId <= DateTime.toDays()
        ) {
            return false;
        }

        IStruct.Pool memory pool = liquidityPools.getPoolById(
            depositRecord.tokenAddress,
            depositRecord.poolId
        );

        return pool.availableAmount >= depositRecord.depositAmount;
    }
}
