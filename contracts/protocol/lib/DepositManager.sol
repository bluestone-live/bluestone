// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../../common/lib/DateTime.sol';
import '../interface/IStruct.sol';
import './LoanManager.sol';
import './Configuration.sol';
import './LiquidityPools.sol';

/// @title Implement deposit-related operations
library DepositManager {
    using Configuration for Configuration.State;
    using LiquidityPools for LiquidityPools.State;
    using LoanManager for LoanManager.State;
    using SafeERC20 for ERC20;

    struct State {
        // Total number of deposits
        uint256 numDeposits;
        // Enabled deposit terms
        uint256[] depositTermList;
        // Enabled deposit tokens
        address[] depositTokenAddressList;
        // Deposit term -> enabled?
        mapping(uint256 => bool) isDepositTermEnabled;
        // Deposit token -> enabled?
        mapping(address => bool) isDepositTokenEnabled;
        // ID -> DepositRecord
        mapping(bytes32 => IStruct.DepositRecord) depositRecordById;
        // AccountAddress -> DepositIds
        mapping(address => bytes32[]) depositIdsByAccountAddress;
    }

    uint256 private constant ONE = 10**18;
    address private constant ETH_IDENTIFIER = address(1);

    event EnableDepositTermsSucceed(
        address indexed adminAddress,
        uint256[] terms
    );

    event DisableDepositTermsSucceed(
        address indexed adminAddress,
        uint256[] terms
    );

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
        address indexed depositTokenAddress,
        uint256 amount
    );

    event WithdrawSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        address indexed depositTokenAddress,
        uint256 amount
    );

    event EarlyWithdrawSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        address indexed depositTokenAddress,
        uint256 amount
    );

    event InterestReserveTransferred(
        address indexed accountAddress,
        bytes32 recordId,
        address indexed depositTokenAddress,
        uint256 interestForProtocolReserve
    );

    event DepositDistributorFeeTransferred(
        address indexed distributorAccountAddress,
        bytes32 recordId,
        address indexed depositTokenAddress,
        uint256 interestForDistributor
    );

    event PayDepositDistributorFailed(
        address indexed distributorAddress,
        address indexed depositTokenAddress,
        bytes32 recordId,
        uint256 amount
    );

    function getDepositRecordById(
        State storage self,
        LiquidityPools.State storage liquidityPools,
        bytes32 depositId
    )
        public
        view
        returns (IStruct.GetDepositRecordResponse memory depositRecordResponse)
    {
        IStruct.DepositRecord memory depositRecord = self.depositRecordById[
            depositId
        ];

        require(
            depositRecord.tokenAddress != address(0),
            'DepositManager: invalid deposit ID'
        );

        (
            uint256 interestForDepositor,
            ,
            ,

        ) = _getInterestDistributionByDepositId(
                self,
                liquidityPools,
                depositId
            );

        return
            IStruct.GetDepositRecordResponse({
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
    }

    function isDepositEarlyWithdrawable(
        State storage self,
        LiquidityPools.State storage liquidityPools,
        bytes32 depositId
    ) public view returns (bool isEarlyWithdrawable) {
        IStruct.DepositRecord memory depositRecord = self.depositRecordById[
            depositId
        ];

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

    function enableDepositTerm(
        State storage self,
        LiquidityPools.State storage liquidityPools,
        uint256 term
    ) external {
        uint256[] memory terms = new uint256[](1);
        terms[0] = term;
        enableDepositTerms(self, liquidityPools, terms);
    }

    function enableDepositTerms(
        State storage self,
        LiquidityPools.State storage liquidityPools,
        uint256[] memory terms
    ) public {
        require(terms.length > 0, 'DepositManager: empty terms');

        uint256 maxTerm = 0;
        uint256 term;
        for (uint256 i = 0; i < terms.length; i++) {
            term = terms[i];
            require(
                !self.isDepositTermEnabled[term],
                'DepositManager: term already enabled'
            );

            self.isDepositTermEnabled[term] = true;
            self.depositTermList.push(term);

            if (term > maxTerm) {
                maxTerm = term;
            }
        }

        /// Update pool group size only if the max term is greater than
        /// the current pool group size
        if (maxTerm > liquidityPools.poolGroupSize) {
            liquidityPools.setPoolGroupSize(maxTerm);
        }

        emit EnableDepositTermsSucceed(msg.sender, terms);
    }

    function disableDepositTerm(State storage self, uint256 term) external {
        uint256[] memory terms = new uint256[](1);
        terms[0] = term;
        disableDepositTerms(self, terms);
    }

    function disableDepositTerms(State storage self, uint256[] memory terms)
        public
    {
        require(terms.length > 0, 'DepositManager: empty terms');

        uint256 term;
        for (uint256 i = 0; i < terms.length; i++) {
            term = terms[i];
            require(
                self.isDepositTermEnabled[term],
                'DepositManager: term already disabled'
            );

            self.isDepositTermEnabled[term] = false;

            // Remove term from depositTermList
            uint256 numDepositTerms = self.depositTermList.length;
            uint256 lastDepositTerm = self.depositTermList[numDepositTerms - 1];
            for (uint256 j = 0; j < self.depositTermList.length; j++) {
                if (self.depositTermList[j] == term) {
                    // Overwrite current term with the last term
                    self.depositTermList[j] = lastDepositTerm;

                    // Shrink array size
                    self.depositTermList.pop();

                    // Stop the loop once the term is found
                    break;
                }
            }
        }

        emit DisableDepositTermsSucceed(msg.sender, terms);
    }

    function enableDepositToken(State storage self, address tokenAddress)
        external
    {
        require(
            !self.isDepositTokenEnabled[tokenAddress],
            'DepositManager: token already enabled'
        );

        self.isDepositTokenEnabled[tokenAddress] = true;
        self.depositTokenAddressList.push(tokenAddress);

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
                address lastDepositTokenAddress = self.depositTokenAddressList[
                    numDepositTokens - 1
                ];

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

        require(
            depositParameters.depositAmount > 0,
            'DepositManager: invalid deposit amount'
        );

        uint256 tokenBalanceAfterTx;

        if (depositParameters.tokenAddress == ETH_IDENTIFIER) {
            require(
                msg.value == depositParameters.depositAmount,
                'DepositManager: depositAmount must be equal to msg.value'
            );
            tokenBalanceAfterTx = address(this).balance;
        } else {
            require(
                msg.value == 0,
                'DepositManager: msg.value is not accepted'
            );

            tokenBalanceAfterTx =
                ERC20(depositParameters.tokenAddress).balanceOf(address(this)) +
                depositParameters.depositAmount;
        }

        require(
            tokenBalanceAfterTx <=
                configuration.balanceCapByToken[depositParameters.tokenAddress],
            'DepositManager: token balance cap exceeded'
        );

        uint256 depositWeight = configuration
            .interestRateModel
            .getDepositWeight(
                depositParameters.depositAmount,
                depositParameters.depositTerm
            );

        uint256 poolId = liquidityPools.addDepositToPool(
            depositParameters.tokenAddress,
            depositParameters.depositAmount,
            depositParameters.depositTerm,
            depositWeight,
            configuration.depositDistributorFeeRatio,
            configuration.loanDistributorFeeRatio,
            configuration.protocolReserveRatio
        );

        self.numDeposits++;

        // Compute a hash as deposit ID
        bytes32 currDepositId = keccak256(
            abi.encode(msg.sender, poolId, self.numDeposits)
        );

        self.depositRecordById[currDepositId] = IStruct.DepositRecord({
            depositId: currDepositId,
            ownerAddress: payable(msg.sender),
            tokenAddress: depositParameters.tokenAddress,
            depositTerm: depositParameters.depositTerm,
            depositAmount: depositParameters.depositAmount,
            poolId: poolId,
            createdAt: block.timestamp,
            withdrewAt: 0,
            weight: depositWeight,
            distributorAddress: depositParameters.distributorAddress
        });

        // Transfer ERC20 token from user to protocol (`this` refers to Protocol contract)
        if (depositParameters.tokenAddress != ETH_IDENTIFIER) {
            ERC20(address(depositParameters.tokenAddress)).safeTransferFrom(
                msg.sender,
                address(this),
                depositParameters.depositAmount
            );
        }

        self.depositIdsByAccountAddress[msg.sender].push(currDepositId);

        emit DepositSucceed(
            msg.sender,
            currDepositId,
            depositParameters.tokenAddress,
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
        IStruct.DepositRecord storage depositRecord = self.depositRecordById[
            depositId
        ];

        require(
            depositRecord.tokenAddress != address(0),
            'DepositManager: invalid deposit ID'
        );

        require(
            configuration.interestReserveAddress != address(0),
            'DepositManager: interestReserveAddress is not set'
        );

        address tokenAddress = depositRecord.tokenAddress;

        require(
            msg.sender == depositRecord.ownerAddress,
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

        (
            uint256 interestForDepositor,
            uint256 interestForDepositDistributor,
            ,
            uint256 interestForProtocolReserve
        ) = _getInterestDistributionByDepositId(
                self,
                liquidityPools,
                depositId
            );

        uint256 availableAmountToBeWithdrawn = depositRecord.depositAmount +
            interestForDepositor +
            interestForDepositDistributor +
            interestForProtocolReserve;

        IStruct.Pool memory pool = liquidityPools.getPoolById(
            tokenAddress,
            depositRecord.poolId
        );
        require(
            pool.availableAmount >= availableAmountToBeWithdrawn,
            'DepositManager: insufficient available amount for withdrawal'
        );

        liquidityPools.withdrawFromPool(
            depositRecord.tokenAddress,
            0,
            0,
            availableAmountToBeWithdrawn,
            depositRecord.poolId
        );

        uint256 depositPlusInterestAmount = depositRecord.depositAmount +
            interestForDepositor;

        depositRecord.withdrewAt = block.timestamp;

        if (tokenAddress == ETH_IDENTIFIER) {
            // Transfer deposit distributor fee to distributor if distributor set
            if (depositRecord.distributorAddress != address(this)) {
                /// By using .send() instead of .transfer(), we ensure this call does not revert
                /// due to the passed in distributorAddress rejects receiving ether
                bool succeed = depositRecord.distributorAddress.send(
                    interestForDepositDistributor
                );

                if (succeed) {
                    emit DepositDistributorFeeTransferred(
                        depositRecord.distributorAddress,
                        depositId,
                        tokenAddress,
                        interestForDepositDistributor
                    );
                } else {
                    emit PayDepositDistributorFailed(
                        depositRecord.distributorAddress,
                        depositRecord.tokenAddress,
                        depositId,
                        interestForDepositDistributor
                    );
                }
            }

            // Transfer protocol reserve to interest reserve address
            configuration.interestReserveAddress.transfer(
                interestForProtocolReserve
            );

            // Transfer deposit plus interest to depositor
            payable(msg.sender).transfer(depositPlusInterestAmount);
        } else {
            // Transfer deposit distributor fee to distributor if distributor set
            if (depositRecord.distributorAddress != address(this)) {
                ERC20(tokenAddress).safeTransfer(
                    depositRecord.distributorAddress,
                    interestForDepositDistributor
                );

                emit DepositDistributorFeeTransferred(
                    depositRecord.distributorAddress,
                    depositId,
                    tokenAddress,
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
                msg.sender,
                depositPlusInterestAmount
            );
        }

        emit WithdrawSucceed(
            msg.sender,
            depositId,
            tokenAddress,
            depositPlusInterestAmount
        );

        emit InterestReserveTransferred(
            configuration.interestReserveAddress,
            depositId,
            tokenAddress,
            interestForProtocolReserve
        );

        return depositPlusInterestAmount;
    }

    function earlyWithdraw(
        State storage self,
        LiquidityPools.State storage liquidityPools,
        bytes32 depositId
    ) external returns (uint256 withdrewAmount) {
        IStruct.DepositRecord storage depositRecord = self.depositRecordById[
            depositId
        ];

        address tokenAddress = depositRecord.tokenAddress;

        require(
            msg.sender == depositRecord.ownerAddress,
            'DepositManager: invalid owner'
        );

        require(
            isDepositEarlyWithdrawable(self, liquidityPools, depositId),
            'DepositManager: cannot early withdraw'
        );

        liquidityPools.withdrawFromPool(
            depositRecord.tokenAddress,
            depositRecord.depositAmount,
            depositRecord.weight,
            depositRecord.depositAmount,
            depositRecord.poolId
        );

        depositRecord.withdrewAt = block.timestamp;

        if (tokenAddress == ETH_IDENTIFIER) {
            payable(msg.sender).transfer(depositRecord.depositAmount);
        } else {
            ERC20(tokenAddress).safeTransfer(
                msg.sender,
                depositRecord.depositAmount
            );
        }

        emit EarlyWithdrawSucceed(
            msg.sender,
            depositRecord.depositId,
            depositRecord.tokenAddress,
            depositRecord.depositAmount
        );

        return depositRecord.depositAmount;
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
        bytes32[] memory depositIdList = self.depositIdsByAccountAddress[
            accountAddress
        ];

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
        IStruct.DepositRecord memory depositRecord = self.depositRecordById[
            depositId
        ];

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

        uint256 totalInterest = (pool.loanInterest *
            depositRecord.weight *
            ONE) /
            pool.totalDepositWeight /
            ONE;

        interestForDepositDistributor =
            (totalInterest * pool.depositDistributorFeeRatio) /
            ONE;

        interestForLoanDistributor =
            (totalInterest * pool.loanDistributorFeeRatio) /
            ONE;

        interestForProtocolReserve =
            (totalInterest * pool.protocolReserveRatio) /
            ONE;

        interestForDepositor =
            totalInterest -
            interestForDepositDistributor -
            interestForLoanDistributor -
            interestForProtocolReserve;

        return (
            interestForDepositor,
            interestForDepositDistributor,
            interestForLoanDistributor,
            interestForProtocolReserve
        );
    }
}
