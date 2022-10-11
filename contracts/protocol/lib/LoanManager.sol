// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/utils/math/Math.sol';
import '../../common/lib/DateTime.sol';
import '../interface/IStruct.sol';
import './Configuration.sol';
import './LiquidityPools.sol';
import './DepositManager.sol';

/// @title Implement loan-related operations
library LoanManager {
    using Configuration for Configuration.State;
    using LiquidityPools for LiquidityPools.State;
    using DepositManager for DepositManager.State;
    using SafeERC20 for ERC20;

    struct State {
        // Total number of loans
        uint256 numLoans;
        // Loan ID -> LoanRecord
        mapping(bytes32 => IStruct.LoanRecord) loanRecordById;
        // accountAddress -> loanIds
        mapping(address => bytes32[]) loanIdsByAccount;
        // loanTokenAddress -> collateralTokenAddress -> LoanAndCollateralTokenPair
        mapping(address => mapping(address => IStruct.LoanAndCollateralTokenPair)) loanAndCollateralTokenPairs;
        // Enabled list of token pairs
        IStruct.LoanAndCollateralTokenPair[] loanAndCollateralTokenPairList;
    }

    uint256 private constant ONE = 10**18;
    address private constant ETH_IDENTIFIER = address(1);

    struct LoanLocalVars {
        IPriceOracle loanTokenPriceOracle;
        IPriceOracle collateralTokenPriceOracle;
        bytes32 loanId;
        uint256 collateralAmount;
        uint256 collateralCoverageRatio;
        uint256 loanInterestRate;
        uint256 loanInterest;
        uint256 maxLoanTerm;
    }

    struct RepayLoanLocalVars {
        uint256 remainingDebt;
        uint256 remainingPrincipal;
        uint256 remainingCollateralAmount;
        uint256 repayAmountToPools;
        uint256 loanDistributorFeeRatio;
    }

    struct LiquidateLoanLocalVars {
        IPriceOracle loanTokenPriceOracle;
        IPriceOracle collateralTokenPriceOracle;
        uint256 collateralCoverageRatio;
        uint256 liquidatedAmount;
        uint256 remainingCollateralAmount;
        uint256 remainingDebt;
        uint256 soldCollateralAmount;
        uint256 loanTokenPrice;
        uint256 collateralTokenPrice;
        uint256 loanTokenDecimals;
        uint256 collateralTokenDecimals;
        bool isUnderCollateralCoverageRatio;
        bool isOverDue;
    }

    struct GetLoanRecordByIdLocalVars {
        IPriceOracle loanTokenPriceOracle;
        IPriceOracle collateralTokenPriceOracle;
        uint256 remainingDebt;
        uint256 collateralCoverageRatio;
    }

    struct SubtractCollateralLocalVars {
        IPriceOracle loanTokenPriceOracle;
        IPriceOracle collateralTokenPriceOracle;
        uint256 collateralCoverageRatio;
    }

    struct CollateralCoverageRatioParams {
        uint256 collateralAmount;
        uint256 collateralTokenDecimals;
        uint256 collateralTokenPrice;
        uint256 loanAmount;
        uint256 loanTokenDecimals;
        uint256 loanTokenPrice;
    }

    event SetLoanAndCollateralTokenPairSucceed(
        address indexed adminAddress,
        address loanTokenAddress,
        address collateralTokenAddress,
        uint256 minCollateralCoverageRatio,
        uint256 liquidationDiscount
    );

    event RemoveLoanAndCollateralTokenPairSucceed(
        address indexed adminAddress,
        address loanTokenAddress,
        address collateralTokenAddress
    );

    event LoanSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        address indexed loanTokenAddress,
        uint256 loanAmount,
        address indexed collateralTokenAddress,
        uint256 collateralAmount
    );

    event RepayLoanSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        address indexed loanTokenAddress,
        uint256 repayAmount,
        address indexed collateralTokenAddress,
        uint256 returnedCollateralAmount,
        bool isFullyRepaid
    );

    event LiquidateLoanSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        address indexed loanTokenAddress,
        uint256 liquidateAmount,
        address indexed collateralTokenAddress,
        uint256 soldCollateralAmount
    );

    event AddCollateralSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        address indexed collateralTokenAddress,
        uint256 collateralAmount
    );

    event LoanDistributorFeeTransferred(
        address indexed distributorAccountAddress,
        bytes32 recordId,
        address indexed loanTokenAddress,
        uint256 interestForLoanDistributor
    );

    event PayLoanDistributorFailed(
        address indexed distributorAddress,
        address indexed loanTokenAddress,
        bytes32 recordId,
        uint256 amount
    );

    event SubtractCollateralSucceed(
        address indexed accountAddress,
        address indexed collateralTokenAddress,
        bytes32 recordId,
        uint256 collateralAmount
    );

    function getLoanRecordById(
        State storage self,
        Configuration.State storage configuration,
        bytes32 loanId
    )
        public
        view
        returns (IStruct.GetLoanRecordResponse memory loanRecordResponse)
    {
        IStruct.LoanRecord memory loanRecord = self.loanRecordById[loanId];
        IStruct.LoanAndCollateralTokenPair storage tokenPair = self.loanAndCollateralTokenPairs[loanRecord.loanTokenAddress][loanRecord.collateralTokenAddress];

        require(
            loanRecord.loanTokenAddress != address(0),
            'LoanManager: invalid loan ID'
        );

        GetLoanRecordByIdLocalVars memory local;
        local.remainingDebt = _calculateRemainingDebt(loanRecord);

        if (loanRecord.isClosed) {
            // If loan is closed, collateral coverage ratio becomes meaningless
            local.collateralCoverageRatio = 0;
        } else {
            local.loanTokenPriceOracle = configuration.priceOracleByToken[
                loanRecord.loanTokenAddress
            ];
            local.collateralTokenPriceOracle = configuration.priceOracleByToken[
                loanRecord.collateralTokenAddress
            ];

            local.collateralCoverageRatio = _calculateCollateralCoverageRatio(
                CollateralCoverageRatioParams({
                    collateralAmount: loanRecord.collateralAmount -
                        loanRecord.soldCollateralAmount,
                    collateralTokenDecimals: _getTokenDecimals(
                        loanRecord.collateralTokenAddress
                    ),
                    collateralTokenPrice: local
                        .collateralTokenPriceOracle
                        .getPrice(),
                    loanAmount: local.remainingDebt,
                    loanTokenDecimals: _getTokenDecimals(
                        loanRecord.loanTokenAddress
                    ),
                    loanTokenPrice: local.loanTokenPriceOracle.getPrice()
                })
            );
        }

        loanRecordResponse = IStruct.GetLoanRecordResponse({
            isClosed: loanRecord.isClosed,
            loanId: loanRecord.loanId,
            loanTokenAddress: loanRecord.loanTokenAddress,
            collateralTokenAddress: loanRecord.collateralTokenAddress,
            loanAmount: loanRecord.loanAmount,
            collateralAmount: loanRecord.collateralAmount,
            loanTerm: loanRecord.loanTerm,
            annualInterestRate: loanRecord.annualInterestRate,
            interest: loanRecord.interest,
            collateralCoverageRatio: local.collateralCoverageRatio,
            minCollateralCoverageRatio: tokenPair.minCollateralCoverageRatio,
            alreadyPaidAmount: loanRecord.alreadyPaidAmount,
            liquidatedAmount: loanRecord.liquidatedAmount,
            soldCollateralAmount: loanRecord.soldCollateralAmount,
            createdAt: loanRecord.createdAt,
            dueAt: loanRecord.dueAt,
            remainingDebt: local.remainingDebt
        });

        return loanRecordResponse;
    }

    function getLoanRecordsByAccount(
        State storage self,
        Configuration.State storage configuration,
        address accountAddress
    )
        external
        view
        returns (IStruct.GetLoanRecordResponse[] memory loanRecordList)
    {
        bytes32[] memory loanIdList = self.loanIdsByAccount[accountAddress];
        loanRecordList = new IStruct.GetLoanRecordResponse[](loanIdList.length);

        for (uint256 i = 0; i < loanIdList.length; i++) {
            loanRecordList[i] = getLoanRecordById(
                self,
                configuration,
                loanIdList[i]
            );
        }

        return loanRecordList;
    }

    function addCollateral(
        State storage self,
        bytes32 loanId,
        uint256 collateralAmount
    ) external returns (uint256 totalCollateralAmount) {
        IStruct.LoanRecord storage record = self.loanRecordById[loanId];

        require(
            msg.sender == record.ownerAddress,
            'LoanManager: invalid owner'
        );

        require(
            !self.loanRecordById[loanId].isClosed,
            'LoanManager: loan already closed'
        );

        require(collateralAmount > 0, 'LoanManager: invalid collateralAmount');

        if (record.collateralTokenAddress == ETH_IDENTIFIER) {
            require(
                msg.value == collateralAmount,
                'LoanManager: collateralAmount must be equal to msg.value'
            );
        } else {
            require(msg.value == 0, 'LoanManager: msg.value is not accepted');

            // Transfer collateral from user account to protocol
            ERC20(record.collateralTokenAddress).safeTransferFrom(
                msg.sender,
                address(this),
                collateralAmount
            );
        }

        record.collateralAmount = record.collateralAmount + collateralAmount;

        emit AddCollateralSucceed(
            msg.sender,
            loanId,
            record.collateralTokenAddress,
            collateralAmount
        );

        return record.collateralAmount;
    }

    function subtractCollateral(
        State storage self,
        Configuration.State storage configuration,
        bytes32 loanId,
        uint256 collateralAmount
    ) external returns (uint256 totalCollateralAmount) {
        IStruct.LoanRecord storage record = self.loanRecordById[loanId];

        require(
            msg.sender == record.ownerAddress,
            'LoanManager: invalid owner'
        );

        require(!record.isClosed, 'LoanManager: loan already closed');

        require(collateralAmount > 0, 'LoanManager: invalid collateralAmount');

        IStruct.LoanAndCollateralTokenPair storage tokenPair = self
            .loanAndCollateralTokenPairs[record.loanTokenAddress][
                record.collateralTokenAddress
            ];

        SubtractCollateralLocalVars memory local;

        local.loanTokenPriceOracle = configuration.priceOracleByToken[
            record.loanTokenAddress
        ];
        local.collateralTokenPriceOracle = configuration.priceOracleByToken[
            record.collateralTokenAddress
        ];

        local.loanTokenPriceOracle.updatePriceIfNeeded();
        local.collateralTokenPriceOracle.updatePriceIfNeeded();

        local.collateralCoverageRatio = _calculateCollateralCoverageRatio(
            CollateralCoverageRatioParams({
                collateralAmount: record.collateralAmount -
                    record.soldCollateralAmount -
                    collateralAmount,
                collateralTokenDecimals: _getTokenDecimals(
                    record.collateralTokenAddress
                ),
                collateralTokenPrice: local
                    .collateralTokenPriceOracle
                    .getPrice(),
                loanAmount: _calculateRemainingDebt(record),
                loanTokenDecimals: _getTokenDecimals(record.loanTokenAddress),
                loanTokenPrice: local.loanTokenPriceOracle.getPrice()
            })
        );

        require(
            local.collateralCoverageRatio >=
                tokenPair.minCollateralCoverageRatio,
            'LoanManager: invalid collateral coverage ratio after subtraction'
        );

        // Transfer collateral from protocol to user
        if (record.collateralTokenAddress == ETH_IDENTIFIER) {
            payable(msg.sender).transfer(collateralAmount);
        } else {
            ERC20(record.collateralTokenAddress).safeTransfer(
                msg.sender,
                collateralAmount
            );
        }

        record.collateralAmount = record.collateralAmount - collateralAmount;

        emit SubtractCollateralSucceed(
            msg.sender,
            record.collateralTokenAddress,
            loanId,
            collateralAmount
        );

        return record.collateralAmount;
    }

    function loan(
        State storage self,
        Configuration.State storage configuration,
        LiquidityPools.State storage liquidityPools,
        IStruct.LoanParameters calldata loanParameters
    ) external returns (bytes32 loanId) {
        IStruct.LoanAndCollateralTokenPair storage tokenPair = self
            .loanAndCollateralTokenPairs[loanParameters.loanTokenAddress][
                loanParameters.collateralTokenAddress
            ];

        require(
            tokenPair.minCollateralCoverageRatio != 0,
            'LoanManager: invalid token pair'
        );

        require(
            loanParameters.loanAmount > 0,
            'LoanManager: invalid loan amount'
        );

        require(
            loanParameters.collateralAmount > 0,
            'LoanManager: invalid collateral amount'
        );

        if (loanParameters.collateralTokenAddress == ETH_IDENTIFIER) {
            require(
                msg.value == loanParameters.collateralAmount,
                'LoanManager: collateralAmount must be equal to msg.value'
            );
        } else {
            require(msg.value == 0, 'LoanManager: msg.value is not accepted');
        }

        LoanLocalVars memory local;

        local.maxLoanTerm = liquidityPools.poolGroupSize;

        require(
            loanParameters.loanTerm <= local.maxLoanTerm,
            'LoanManager: invalid loan term'
        );

        require(
            loanParameters.distributorAddress != address(0),
            'LoanManager: invalid distributor address'
        );

        local.loanInterestRate = configuration
            .interestModel
            .getLoanInterestRate(
                loanParameters.loanTokenAddress,
                loanParameters.loanTerm,
                local.maxLoanTerm
            );

        local.loanInterest =
            (((loanParameters.loanAmount * local.loanInterestRate) / ONE) *
                loanParameters.loanTerm) /
            365;

        local.loanTokenPriceOracle = configuration.priceOracleByToken[
            loanParameters.loanTokenAddress
        ];
        local.collateralTokenPriceOracle = configuration.priceOracleByToken[
            loanParameters.collateralTokenAddress
        ];

        local.loanTokenPriceOracle.updatePriceIfNeeded();
        local.collateralTokenPriceOracle.updatePriceIfNeeded();

        local.collateralCoverageRatio = _calculateCollateralCoverageRatio(
            CollateralCoverageRatioParams({
                collateralAmount: loanParameters.collateralAmount,
                collateralTokenDecimals: _getTokenDecimals(
                    loanParameters.collateralTokenAddress
                ),
                collateralTokenPrice: local
                    .collateralTokenPriceOracle
                    .getPrice(),
                loanAmount: loanParameters.loanAmount + local.loanInterest,
                loanTokenDecimals: _getTokenDecimals(
                    loanParameters.loanTokenAddress
                ),
                loanTokenPrice: local.loanTokenPriceOracle.getPrice()
            })
        );

        require(
            local.collateralCoverageRatio >=
                tokenPair.minCollateralCoverageRatio,
            'LoanManager: invalid collateral coverage ratio'
        );

        self.numLoans++;

        local.loanId = keccak256(abi.encode(msg.sender, self.numLoans));

        self.loanRecordById[local.loanId] = IStruct.LoanRecord({
            loanId: local.loanId,
            ownerAddress: payable(msg.sender),
            loanTokenAddress: loanParameters.loanTokenAddress,
            collateralTokenAddress: loanParameters.collateralTokenAddress,
            loanAmount: loanParameters.loanAmount,
            collateralAmount: loanParameters.collateralAmount,
            loanTerm: loanParameters.loanTerm,
            annualInterestRate: local.loanInterestRate,
            interest: local.loanInterest,
            // minCollateralCoverageRatio: tokenPair.minCollateralCoverageRatio,
            liquidationDiscount: tokenPair.liquidationDiscount,
            alreadyPaidAmount: 0,
            liquidatedAmount: 0,
            soldCollateralAmount: 0,
            createdAt: block.timestamp,
            dueAt: loanParameters.loanTerm *
                DateTime.dayInSeconds() +
                block.timestamp,
            lastInterestUpdatedAt: block.timestamp,
            lastRepaidAt: 0,
            lastLiquidatedAt: 0,
            isClosed: false,
            distributorAddress: loanParameters.distributorAddress,
            distributorInterest: 0
        });

        liquidityPools.loanFromPools(self.loanRecordById[local.loanId]);

        if (loanParameters.loanTokenAddress == ETH_IDENTIFIER) {
            payable(msg.sender).transfer(loanParameters.loanAmount);
        } else {
            // Transfer loan tokens from protocol to loaner
            ERC20(loanParameters.loanTokenAddress).safeTransfer(
                msg.sender,
                loanParameters.loanAmount
            );
        }

        if (loanParameters.collateralTokenAddress != ETH_IDENTIFIER) {
            // Transfer collateral tokens from loaner to protocol
            ERC20(loanParameters.collateralTokenAddress).safeTransferFrom(
                msg.sender,
                address(this),
                loanParameters.collateralAmount
            );
        }

        self.loanIdsByAccount[msg.sender].push(local.loanId);

        emit LoanSucceed(
            msg.sender,
            local.loanId,
            loanParameters.loanTokenAddress,
            loanParameters.loanAmount,
            loanParameters.collateralTokenAddress,
            loanParameters.collateralAmount
        );

        return local.loanId;
    }

    function setLoanAndCollateralTokenPair(
        State storage self,
        address loanTokenAddress,
        address collateralTokenAddress,
        uint256 minCollateralCoverageRatio,
        uint256 liquidationDiscount
    ) external {
        require(
            loanTokenAddress != collateralTokenAddress,
            'LoanManager: invalid token pair'
        );

        require(
            minCollateralCoverageRatio != 0,
            'LoanManager: invalid minCollateralCoverageRatio'
        );
        require(
            liquidationDiscount != 0,
            'LoanManager: invalid liquidationDiscount'
        );

        IStruct.LoanAndCollateralTokenPair memory tokenPair = IStruct
            .LoanAndCollateralTokenPair({
                loanTokenAddress: loanTokenAddress,
                collateralTokenAddress: collateralTokenAddress,
                minCollateralCoverageRatio: minCollateralCoverageRatio,
                liquidationDiscount: liquidationDiscount
            });

        // Add this token pair only if it hasn't been added yet
        if (
            self
            .loanAndCollateralTokenPairs[loanTokenAddress][
                collateralTokenAddress
            ].minCollateralCoverageRatio == 0
        ) {
            self.loanAndCollateralTokenPairList.push(tokenPair);
        }

        self.loanAndCollateralTokenPairs[loanTokenAddress][
            collateralTokenAddress
        ] = tokenPair;

        emit SetLoanAndCollateralTokenPairSucceed(
            msg.sender,
            loanTokenAddress,
            collateralTokenAddress,
            minCollateralCoverageRatio,
            liquidationDiscount
        );
    }

    function removeLoanAndCollateralTokenPair(
        State storage self,
        address loanTokenAddress,
        address collateralTokenAddress
    ) external {
        IStruct.LoanAndCollateralTokenPair storage targetTokenPair = self
            .loanAndCollateralTokenPairs[loanTokenAddress][
                collateralTokenAddress
            ];

        require(
            targetTokenPair.minCollateralCoverageRatio != 0,
            'LoanManager: invalid token pair'
        );

        uint256 numTokenPairs = self.loanAndCollateralTokenPairList.length;

        for (uint256 i = 0; i < numTokenPairs; i++) {
            IStruct.LoanAndCollateralTokenPair storage tokenPair = self
                .loanAndCollateralTokenPairList[i];

            if (
                tokenPair.loanTokenAddress == loanTokenAddress &&
                tokenPair.collateralTokenAddress == collateralTokenAddress
            ) {
                self.loanAndCollateralTokenPairList[i] = self
                    .loanAndCollateralTokenPairList[numTokenPairs - 1];

                self.loanAndCollateralTokenPairList.pop();

                delete self.loanAndCollateralTokenPairs[loanTokenAddress][
                    collateralTokenAddress
                ];

                break;
            }
        }

        emit RemoveLoanAndCollateralTokenPairSucceed(
            msg.sender,
            loanTokenAddress,
            collateralTokenAddress
        );
    }

    function repayLoan(
        State storage self,
        LiquidityPools.State storage liquidityPools,
        bytes32 loanId,
        uint256 repayAmount
    ) external returns (uint256 remainingDebt) {
        IStruct.LoanRecord storage loanRecord = self.loanRecordById[loanId];

        require(
            msg.sender == loanRecord.ownerAddress,
            'LoanManager: invalid owner'
        );

        require(!loanRecord.isClosed, 'LoanManager: loan already closed');

        RepayLoanLocalVars memory local;
        local.remainingDebt = _calculateRemainingDebt(loanRecord);

        require(
            repayAmount > 0 && repayAmount <= local.remainingDebt,
            'LoanManager: invalid repay amount'
        );

        if (loanRecord.loanTokenAddress == ETH_IDENTIFIER) {
            require(
                msg.value == repayAmount,
                'LoanManager: repayAmount must be equal to msg.value'
            );
        } else {
            require(msg.value == 0, 'LoanManager: msg.value is not accepted');

            ERC20(loanRecord.loanTokenAddress).safeTransferFrom(
                msg.sender,
                address(this),
                repayAmount
            );
        }

        if (loanRecord.interest > 0) {
            local.loanDistributorFeeRatio =
                (loanRecord.distributorInterest * ONE) /
                loanRecord.interest;
        }

        /// In repay process. we need to ensure that the loan distribution fee can't be lent
        /// So we should determine if user repays interest each time
        if (loanRecord.alreadyPaidAmount >= loanRecord.loanAmount) {
            // Only repays interest
            local.repayAmountToPools =
                (repayAmount * (ONE - local.loanDistributorFeeRatio)) /
                ONE;
        } else if (
            loanRecord.alreadyPaidAmount + repayAmount > loanRecord.loanAmount
        ) {
            // Repays interest and principal
            local.remainingPrincipal =
                loanRecord.loanAmount -
                loanRecord.alreadyPaidAmount;

            local.repayAmountToPools =
                local.remainingPrincipal +
                (((repayAmount - (local.remainingPrincipal)) *
                    (ONE - (local.loanDistributorFeeRatio))) / (ONE));
        } else {
            // Only repays principal
            local.repayAmountToPools = repayAmount;
        }

        liquidityPools.repayLoanToPools(loanRecord, local.repayAmountToPools);

        loanRecord.alreadyPaidAmount =
            loanRecord.alreadyPaidAmount +
            repayAmount;
        loanRecord.lastRepaidAt = block.timestamp;

        if (_calculateRemainingDebt(loanRecord) == 0) {
            loanRecord.isClosed = true;

            local.remainingCollateralAmount =
                loanRecord.collateralAmount -
                loanRecord.soldCollateralAmount;

            if (local.remainingCollateralAmount > 0) {
                // Transfer remaining collateral from protocol to loaner
                if (loanRecord.collateralTokenAddress == ETH_IDENTIFIER) {
                    payable(msg.sender).transfer(
                        local.remainingCollateralAmount
                    );
                } else {
                    ERC20(loanRecord.collateralTokenAddress).safeTransfer(
                        msg.sender,
                        local.remainingCollateralAmount
                    );
                }
            }

            if (loanRecord.distributorAddress != address(this)) {
                _payDistributorInterest(loanRecord);
            }
        }

        emit RepayLoanSucceed(
            msg.sender,
            loanId,
            loanRecord.loanTokenAddress,
            repayAmount,
            loanRecord.collateralTokenAddress,
            loanRecord.isClosed ? local.remainingCollateralAmount : 0,
            loanRecord.isClosed
        );

        return _calculateRemainingDebt(loanRecord);
    }

    function liquidateLoan(
        State storage self,
        Configuration.State storage configuration,
        LiquidityPools.State storage liquidityPools,
        bytes32 loanId,
        uint256 liquidateAmount
    ) external returns (uint256 remainingCollateral, uint256 liquidatedAmount) {
        IStruct.LoanRecord storage loanRecord = self.loanRecordById[loanId];
        IStruct.LoanAndCollateralTokenPair storage targetTokenPair = self.loanAndCollateralTokenPairs[loanRecord.loanTokenAddress][loanRecord.collateralTokenAddress];

        require(
            msg.sender != loanRecord.ownerAddress,
            'LoanManager: invalid user'
        );

        require(!loanRecord.isClosed, 'LoanManager: loan already closed');

        require(liquidateAmount > 0, 'LoanManager: invalid liquidate amount');

        if (loanRecord.loanTokenAddress == ETH_IDENTIFIER) {
            require(
                msg.value == liquidateAmount,
                'LoanManager: liquidateAmount must be equal to msg.value'
            );
        } else {
            require(msg.value == 0, 'LoanManager: msg.value is not accepted');
        }

        LiquidateLoanLocalVars memory local;
        local.loanTokenPriceOracle = configuration.priceOracleByToken[
            loanRecord.loanTokenAddress
        ];
        local.collateralTokenPriceOracle = configuration.priceOracleByToken[
            loanRecord.collateralTokenAddress
        ];

        local.loanTokenPriceOracle.updatePriceIfNeeded();
        local.collateralTokenPriceOracle.updatePriceIfNeeded();
        local.loanTokenPrice = local.loanTokenPriceOracle.getPrice();
        local.collateralTokenPrice = local
            .collateralTokenPriceOracle
            .getPrice();
        local.loanTokenDecimals = _getTokenDecimals(
            loanRecord.loanTokenAddress
        );
        local.collateralTokenDecimals = _getTokenDecimals(
            loanRecord.collateralTokenAddress
        );

        local.remainingDebt = _calculateRemainingDebt(loanRecord);

        local.collateralCoverageRatio = _calculateCollateralCoverageRatio(
            CollateralCoverageRatioParams({
                collateralAmount: loanRecord.collateralAmount -
                    loanRecord.soldCollateralAmount,
                collateralTokenDecimals: local.collateralTokenDecimals,
                collateralTokenPrice: local.collateralTokenPrice,
                loanAmount: local.remainingDebt,
                loanTokenDecimals: local.loanTokenDecimals,
                loanTokenPrice: local.loanTokenPrice
            })
        );

        local.isUnderCollateralCoverageRatio =
            local.collateralCoverageRatio <
            targetTokenPair.minCollateralCoverageRatio;

        local.isOverDue =
            block.timestamp >
            loanRecord.createdAt +
                loanRecord.loanTerm *
                DateTime.dayInSeconds();

        require(
            local.isUnderCollateralCoverageRatio || local.isOverDue,
            'LoanManager: not liquidatable'
        );

        local.liquidatedAmount = Math.min(liquidateAmount, local.remainingDebt);

        local.remainingCollateralAmount =
            loanRecord.collateralAmount -
            loanRecord.soldCollateralAmount;

        local.soldCollateralAmount = Math.min(
            (((local.liquidatedAmount *
                local.loanTokenPrice *
                (ONE / (10**local.loanTokenDecimals))) /
                local.collateralTokenPrice) * ONE) /
                /// Scale up loan tokens value if loan token is less than 18 decimals
                /// since token prices are represented in 10**18 scale
                (ONE - loanRecord.liquidationDiscount),
            local.remainingCollateralAmount
        );

        // Transfer loan tokens from liquidator to protocol
        if (loanRecord.loanTokenAddress != ETH_IDENTIFIER) {
            ERC20(loanRecord.loanTokenAddress).safeTransferFrom(
                msg.sender,
                address(this),
                local.liquidatedAmount
            );
        }

        loanRecord.soldCollateralAmount =
            loanRecord.soldCollateralAmount +
            local.soldCollateralAmount;
        loanRecord.liquidatedAmount =
            loanRecord.liquidatedAmount +
            local.liquidatedAmount;
        loanRecord.lastLiquidatedAt = block.timestamp;

        local.remainingCollateralAmount =
            loanRecord.collateralAmount -
            loanRecord.soldCollateralAmount;

        if (
            local.remainingCollateralAmount == 0 ||
            _calculateRemainingDebt(loanRecord) == 0
        ) {
            // Close the loan if collateral or debt is clear
            loanRecord.isClosed = true;

            if (local.remainingCollateralAmount > 0) {
                // Transfer remaining collateral from protocol to loaner
                if (loanRecord.collateralTokenAddress == ETH_IDENTIFIER) {
                    loanRecord.ownerAddress.transfer(
                        local.remainingCollateralAmount
                    );
                } else {
                    ERC20(loanRecord.collateralTokenAddress).safeTransfer(
                        loanRecord.ownerAddress,
                        local.remainingCollateralAmount
                    );
                }
            }

            if (loanRecord.distributorAddress != address(this)) {
                _payDistributorInterest(loanRecord);
            }
        }

        liquidityPools.repayLoanToPools(loanRecord, local.liquidatedAmount);

        // Transfer collateral amount to liquidator
        if (loanRecord.collateralTokenAddress == ETH_IDENTIFIER) {
            payable(msg.sender).transfer(local.soldCollateralAmount);
        } else {
            ERC20(loanRecord.collateralTokenAddress).safeTransfer(
                msg.sender,
                local.soldCollateralAmount
            );
        }

        emit LiquidateLoanSucceed(
            msg.sender,
            loanId,
            loanRecord.loanTokenAddress,
            local.liquidatedAmount,
            loanRecord.collateralTokenAddress,
            local.soldCollateralAmount
        );

        return (
            loanRecord.collateralAmount - loanRecord.soldCollateralAmount,
            local.liquidatedAmount
        );
    }

    function getLoanAndCollateralTokenPairs(State storage self)
        external
        view
        returns (
            IStruct.LoanAndCollateralTokenPair[]
                memory loanAndCollateralTokenPairList
        )
    {
        return self.loanAndCollateralTokenPairList;
    }

    function getLoanInterestRate(
        State storage,
        Configuration.State storage configuration,
        LiquidityPools.State storage liquidityPools,
        address tokenAddress,
        uint256 loanTerm
    ) external view returns (uint256 loanInterestRate) {
        require(
            loanTerm <= liquidityPools.poolGroupSize,
            'LoanManager: invalid loan term'
        );
        return
            configuration.interestModel.getLoanInterestRate(
                tokenAddress,
                loanTerm,
                liquidityPools.poolGroupSize
            );
    }

    function _payDistributorInterest(IStruct.LoanRecord memory loanRecord)
        private
    {
        bool succeed = true;

        if (loanRecord.loanTokenAddress == ETH_IDENTIFIER) {
            /// By using .send() instead of .transfer(), we ensure this call does not revert
            /// due to the passed in distributorAddress rejects receiving ether
            succeed = loanRecord.distributorAddress.send(
                loanRecord.distributorInterest
            );
        } else {
            ERC20(loanRecord.loanTokenAddress).safeTransfer(
                loanRecord.distributorAddress,
                loanRecord.distributorInterest
            );
        }

        if (succeed) {
            emit LoanDistributorFeeTransferred(
                loanRecord.distributorAddress,
                loanRecord.loanId,
                loanRecord.loanTokenAddress,
                loanRecord.distributorInterest
            );
        } else {
            emit PayLoanDistributorFailed(
                loanRecord.distributorAddress,
                loanRecord.loanTokenAddress,
                loanRecord.loanId,
                loanRecord.distributorInterest
            );
        }
    }

    function _calculateRemainingDebt(IStruct.LoanRecord memory loanRecord)
        internal
        pure
        returns (uint256 remainingDebt)
    {
        return
            loanRecord.loanAmount +
            loanRecord.interest -
            loanRecord.alreadyPaidAmount -
            loanRecord.liquidatedAmount;
    }

    function _getTokenDecimals(address tokenAddress)
        private
        view
        returns (uint256 tokenDecimals)
    {
        if (tokenAddress == ETH_IDENTIFIER) {
            return 18;
        } else {
            return ERC20(tokenAddress).decimals();
        }
    }

    /// collateralCoverageRatio = collateralAmount
    ///     * collateralTokenPrice
    ///     * (10**18 / 10**collateralTokenDecimals)
    ///     * 10**18
    ///     / loanAmount
    ///     / loanTokenPrice
    ///     / (10**18 / 10**loanTokenDecimals)
    ///
    /// Example: Loan 100 USDC (6 decimals) with 300 DAI (18 decimals) collaterals.
    /// Assuming both tokens' prices are $1.
    /// collateralCoverageRatio = (300 * (10**18))
    ///     * (10**18)
    ///     * (10**18 / 10**18)
    ///     * 10**18
    ///     / (100 * (10**6)
    ///     / (10**18)
    ///     / (10**18 / 10**6)
    ///     = 3 * (10**18) = 300%
    function _calculateCollateralCoverageRatio(
        CollateralCoverageRatioParams memory params
    ) private pure returns (uint256 collateralCoverageRatio) {
        return
            (params.collateralAmount *
                params.collateralTokenPrice *
                (ONE / (10**params.collateralTokenDecimals)) *
                ONE) /
            params.loanAmount /
            params.loanTokenPrice /
            (ONE / (10**params.loanTokenDecimals));
    }
}
