pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '../ERC20.sol';
import '../../lib/Math.sol';
import '../../lib/SafeMath.sol';
import '../../lib/FixedMath.sol';
import '../../lib/DateTime.sol';
import '../../lib/SafeERC20.sol';
import '../../interface/IStruct.sol';
import './Configuration.sol';
import './LiquidityPools.sol';
import './DepositManager.sol';

library LoanManager {
    using Configuration for Configuration.State;
    using LiquidityPools for LiquidityPools.State;
    using DepositManager for DepositManager.State;
    using SafeERC20 for ERC20;
    using SafeMath for uint256;
    using FixedMath for uint256;

    struct State {
        // ID -> LoanRecord
        mapping(bytes32 => IStruct.LoanRecord) loanRecordById;
        // accountAddress -> loanIds
        mapping(address => bytes32[]) loanIdsByAccount;
        // loanTokenAddress -> collateralTokenAddress -> LoanAndCollateralTokenPair
        mapping(address => mapping(address => IStruct.LoanAndCollateralTokenPair)) loanAndCollateralTokenPairs;
        IStruct.LoanAndCollateralTokenPair[] loanAndCollateralTokenPairList;
        uint256 numLoans;
    }

    uint256 private constant ONE = 10**18;

    struct LocalVars {
        bytes32 loanId;
        uint256 remainingCollateralAmount;
        uint256 remainingDebt;
        uint256 loanTokenPrice;
        uint256 collateralTokenPrice;
        uint256 currCollateralCoverageRatio;
        uint256 loanInterestRate;
        uint256 liquidatedAmount;
        uint256 loanInterest;
        uint256 soldCollateralAmount;
        uint256 maxLoanTerm;
        bool isUnderCollateralCoverageRatio;
        bool isOverDue;
    }

    event LoanSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        uint256 amount
    );
    event RepayLoanSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        uint256 amount
    );
    event LiquidateLoanSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        uint256 amount
    );
    event AddCollateralSucceed(
        address indexed accountAddress,
        bytes32 indexed recordId,
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

        require(
            loanRecord.loanTokenAddress != address(0),
            'LoanManager: Loan ID is invalid'
        );

        uint256 remainingDebt = _calculateRemainingDebt(loanRecord);
        uint256 currentCollateralRatio;

        if (loanRecord.isClosed) {
            // If loan is closed, collateral coverage ratio becomes meaningless
            currentCollateralRatio = 0;
        } else {
            IPriceOracle loanTokenPriceOracle = configuration
                .priceOracleByToken[loanRecord.loanTokenAddress];
            IPriceOracle collateralTokenPriceOracle = configuration
                .priceOracleByToken[loanRecord.collateralTokenAddress];

            uint256 loanTokenPrice = loanTokenPriceOracle.getPrice();
            uint256 collateralTokenPrice = collateralTokenPriceOracle
                .getPrice();

            currentCollateralRatio = loanRecord
                .collateralAmount
                .sub(loanRecord.soldCollateralAmount)
                .mulFixed(collateralTokenPrice)
                .divFixed(remainingDebt)
                .divFixed(loanTokenPrice);
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
            currentCollateralRatio: currentCollateralRatio,
            minCollateralCoverageRatio: loanRecord.minCollateralCoverageRatio,
            alreadyPaidAmount: loanRecord.alreadyPaidAmount,
            soldCollateralAmount: loanRecord.soldCollateralAmount,
            createdAt: loanRecord.createdAt,
            dueAt: loanRecord.dueAt,
            remainingDebt: remainingDebt
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
        Configuration.State storage configuration,
        bytes32 loanId,
        uint256 collateralAmount
    ) external returns (uint256 totalCollateralAmount) {
        require(
            !self.loanRecordById[loanId].isClosed,
            'LoanManager: loan is closed'
        );

        require(collateralAmount > 0, 'LoanManager: invalid collateralAmount');

        address collateralTokenAddress = self.loanRecordById[loanId]
            .collateralTokenAddress;

        if (collateralTokenAddress == address(1)) {
            configuration.payableProxy.receiveETH.value(collateralAmount);
        } else {
            // Transfer collateral from user account to protocol
            ERC20(collateralTokenAddress).safeTransferFrom(
                msg.sender,
                address(this),
                collateralAmount
            );
        }

        self.loanRecordById[loanId].collateralAmount = self
            .loanRecordById[loanId]
            .collateralAmount
            .add(collateralAmount);

        emit AddCollateralSucceed(msg.sender, loanId, collateralAmount);

        return self.loanRecordById[loanId].collateralAmount;
    }

    function loan(
        State storage self,
        Configuration.State storage configuration,
        LiquidityPools.State storage liquidityPools,
        IStruct.LoanParameters calldata loanParameters
    ) external returns (bytes32 loanId) {
        IStruct.LoanAndCollateralTokenPair storage tokenPair = self
            .loanAndCollateralTokenPairs[loanParameters
            .loanTokenAddress][loanParameters.collateralTokenAddress];

        require(
            tokenPair.minCollateralCoverageRatio != 0,
            'LoanManager: invalid loan and collateral token pair'
        );

        require(
            loanParameters.loanAmount > 0,
            'LoanManager: invalid loan amount'
        );
        require(
            loanParameters.collateralAmount > 0,
            'LoanManager: invalid collateral amount'
        );

        LocalVars memory localVars;
        localVars.maxLoanTerm = liquidityPools.poolGroups[loanParameters
            .loanTokenAddress]
            .numPools;

        require(
            loanParameters.loanTerm <= localVars.maxLoanTerm,
            'LoanManager: invalid loan term'
        );
        require(
            loanParameters.distributorAddress != address(0),
            'LoanManager: invalid distributor address'
        );

        localVars.loanInterestRate = configuration
            .interestModel
            .getLoanInterestRate(
            loanParameters.loanTokenAddress,
            loanParameters.loanTerm,
            localVars.maxLoanTerm
        );
        localVars.loanInterest = loanParameters
            .loanAmount
            .mulFixed(localVars.loanInterestRate)
            .mul(loanParameters.loanTerm)
            .div(365);

        IPriceOracle loanTokenPriceOracle = configuration
            .priceOracleByToken[loanParameters.loanTokenAddress];
        IPriceOracle collateralTokenPriceOracle = configuration
            .priceOracleByToken[loanParameters.collateralTokenAddress];

        loanTokenPriceOracle.updatePriceIfNeeded();
        collateralTokenPriceOracle.updatePriceIfNeeded();
        localVars.loanTokenPrice = loanTokenPriceOracle.getPrice();
        localVars.collateralTokenPrice = collateralTokenPriceOracle.getPrice();

        localVars.currCollateralCoverageRatio = loanParameters
            .collateralAmount
            .mulFixed(localVars.collateralTokenPrice)
            .divFixed(loanParameters.loanAmount.add(localVars.loanInterest))
            .divFixed(localVars.loanTokenPrice);

        require(
            localVars.currCollateralCoverageRatio >=
                tokenPair.minCollateralCoverageRatio,
            'LoanManager: collateral ratio is below requirement'
        );

        self.numLoans++;

        localVars.loanId = keccak256(abi.encode(msg.sender, self.numLoans));

        self.loanRecordById[localVars.loanId] = IStruct.LoanRecord({
            loanId: localVars.loanId,
            ownerAddress: msg.sender,
            loanTokenAddress: loanParameters.loanTokenAddress,
            collateralTokenAddress: loanParameters.collateralTokenAddress,
            loanAmount: loanParameters.loanAmount,
            collateralAmount: loanParameters.collateralAmount,
            loanTerm: loanParameters.loanTerm,
            annualInterestRate: localVars.loanInterestRate,
            interest: localVars.loanInterest,
            minCollateralCoverageRatio: tokenPair.minCollateralCoverageRatio,
            liquidationDiscount: tokenPair.liquidationDiscount,
            alreadyPaidAmount: 0,
            liquidatedAmount: 0,
            soldCollateralAmount: 0,
            createdAt: now,
            dueAt: loanParameters.loanTerm.mul(DateTime.dayInSeconds()) + now,
            lastInterestUpdatedAt: now,
            lastRepaidAt: 0,
            lastLiquidatedAt: 0,
            isClosed: false,
            distributorAddress: loanParameters.distributorAddress,
            distributorInterest: 0
        });

        liquidityPools.loanFromPools(self.loanRecordById[localVars.loanId]);

        if (loanParameters.loanTokenAddress == address(1)) {
            configuration.payableProxy.sendETH(
                msg.sender,
                loanParameters.loanAmount
            );
        } else {
            // Transfer loan tokens from protocol to loaner
            ERC20(loanParameters.loanTokenAddress).safeTransfer(
                msg.sender,
                loanParameters.loanAmount
            );
        }

        if (loanParameters.collateralTokenAddress == address(1)) {
            configuration.payableProxy.receiveETH.value(
                loanParameters.collateralAmount
            )();
        } else {
            // Transfer collateral tokens from loaner to protocol
            ERC20(loanParameters.collateralTokenAddress).safeTransferFrom(
                msg.sender,
                address(this),
                loanParameters.collateralAmount
            );
        }

        self.loanIdsByAccount[msg.sender].push(localVars.loanId);
        emit LoanSucceed(
            msg.sender,
            localVars.loanId,
            loanParameters.loanAmount
        );

        return localVars.loanId;
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
            'LoanManager: two tokens must be different'
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
                .loanAndCollateralTokenPairs[loanTokenAddress][collateralTokenAddress]
                .minCollateralCoverageRatio ==
            0
        ) {
            self.loanAndCollateralTokenPairList.push(tokenPair);
        }

        self
            .loanAndCollateralTokenPairs[loanTokenAddress][collateralTokenAddress] = tokenPair;
    }

    function removeLoanAndCollateralTokenPair(
        State storage self,
        address loanTokenAddress,
        address collateralTokenAddress
    ) external {
        IStruct.LoanAndCollateralTokenPair storage targetTokenPair = self
            .loanAndCollateralTokenPairs[loanTokenAddress][collateralTokenAddress];

        require(
            targetTokenPair.minCollateralCoverageRatio != 0,
            'LoanManager: token pair does not exist'
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

                delete self
                    .loanAndCollateralTokenPairs[loanTokenAddress][collateralTokenAddress];

                break;
            }
        }
    }

    function repayLoan(
        State storage self,
        LiquidityPools.State storage liquidityPools,
        Configuration.State storage configuration,
        bytes32 loanId,
        uint256 repayAmount
    ) external returns (uint256 remainingDebt) {
        IStruct.LoanRecord storage loanRecord = self.loanRecordById[loanId];
        IStruct.LoanAndCollateralTokenPair storage tokenPair = self
            .loanAndCollateralTokenPairs[loanRecord.loanTokenAddress][loanRecord
            .collateralTokenAddress];

        require(
            tokenPair.minCollateralCoverageRatio != 0,
            'LoanManager: invalid loan and collateral token pair'
        );

        require(
            msg.sender == loanRecord.ownerAddress,
            'LoanManager: invalid owner'
        );

        require(!loanRecord.isClosed, 'LoanManager: loan is closed');

        uint256 currRemainingDebt = _calculateRemainingDebt(loanRecord);

        require(
            repayAmount <= currRemainingDebt,
            'LoanManager: invalid repay amount'
        );

        loanRecord.alreadyPaidAmount = loanRecord.alreadyPaidAmount.add(
            repayAmount
        );
        loanRecord.lastRepaidAt = now;

        if (loanRecord.loanTokenAddress == address(1)) {
            configuration.payableProxy.receiveETH.value(repayAmount)();
        } else {
            ERC20(loanRecord.loanTokenAddress).safeTransferFrom(
                msg.sender,
                address(this),
                repayAmount
            );
        }
        // Transfer loan tokens from user to protocol, It's better to get repay before send distribution
        if (_calculateRemainingDebt(loanRecord) == 0) {
            loanRecord.isClosed = true;

            uint256 remainingCollateralAmount = loanRecord.collateralAmount.sub(
                loanRecord.soldCollateralAmount
            );

            if (remainingCollateralAmount > 0) {
                // Transfer remaining collateral from protocol to loaner
                if (loanRecord.collateralTokenAddress == address(1)) {
                    configuration.payableProxy.sendETH(
                        msg.sender,
                        remainingCollateralAmount
                    );
                } else {
                    ERC20(loanRecord.collateralTokenAddress).safeTransfer(
                        msg.sender,
                        remainingCollateralAmount
                    );
                }
            }

            if (loanRecord.distributorAddress != address(this)) {
                if (loanRecord.loanTokenAddress == address(1)) {
                    configuration.payableProxy.sendETH(
                        loanRecord.distributorAddress,
                        loanRecord.distributorInterest
                    );
                } else {
                    ERC20(loanRecord.loanTokenAddress).safeTransfer(
                        loanRecord.distributorAddress,
                        loanRecord.distributorInterest
                    );
                }
            }
        }

        liquidityPools.repayLoanToPools(loanRecord, repayAmount);

        emit RepayLoanSucceed(msg.sender, loanId, repayAmount);

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
        IStruct.LoanAndCollateralTokenPair storage tokenPair = self
            .loanAndCollateralTokenPairs[loanRecord.loanTokenAddress][loanRecord
            .collateralTokenAddress];

        require(
            tokenPair.minCollateralCoverageRatio != 0,
            'LoanManager: invalid loan and collateral token pair'
        );

        require(
            msg.sender != loanRecord.ownerAddress,
            'LoanManager: invalid user'
        );

        require(!loanRecord.isClosed, 'LoanManager: loan already closed');

        LocalVars memory localVars;
        IPriceOracle loanTokenPriceOracle = configuration
            .priceOracleByToken[loanRecord.loanTokenAddress];
        IPriceOracle collateralTokenPriceOracle = configuration
            .priceOracleByToken[loanRecord.collateralTokenAddress];

        loanTokenPriceOracle.updatePriceIfNeeded();
        collateralTokenPriceOracle.updatePriceIfNeeded();
        localVars.loanTokenPrice = loanTokenPriceOracle.getPrice();
        localVars.collateralTokenPrice = collateralTokenPriceOracle.getPrice();

        localVars.remainingDebt = _calculateRemainingDebt(loanRecord);

        localVars.currCollateralCoverageRatio = loanRecord
            .collateralAmount
            .sub(loanRecord.soldCollateralAmount)
            .mulFixed(localVars.collateralTokenPrice)
            .divFixed(localVars.remainingDebt)
            .divFixed(localVars.loanTokenPrice);

        localVars.isUnderCollateralCoverageRatio =
            localVars.currCollateralCoverageRatio <
            loanRecord.minCollateralCoverageRatio;
        localVars.isOverDue =
            now >
            loanRecord.createdAt.add(
                loanRecord.loanTerm.mul(DateTime.dayInSeconds())
            );

        require(
            localVars.isUnderCollateralCoverageRatio || localVars.isOverDue,
            'LoanManager: not liquidatable'
        );

        localVars.liquidatedAmount = Math.min(
            liquidateAmount,
            localVars.remainingDebt
        );
        localVars.soldCollateralAmount = localVars
            .liquidatedAmount
            .mulFixed(localVars.loanTokenPrice)
            .divFixed(localVars.collateralTokenPrice)
            .divFixed(ONE.sub(loanRecord.liquidationDiscount));

        loanRecord.soldCollateralAmount = loanRecord.soldCollateralAmount.add(
            localVars.soldCollateralAmount
        );
        loanRecord.liquidatedAmount = loanRecord.liquidatedAmount.add(
            localVars.liquidatedAmount
        );
        loanRecord.lastLiquidatedAt = now;

        if (_calculateRemainingDebt(loanRecord) == 0) {
            // Close the loan if debt is clear
            loanRecord.isClosed = true;

            localVars.remainingCollateralAmount = loanRecord
                .collateralAmount
                .sub(loanRecord.soldCollateralAmount);

            if (localVars.remainingCollateralAmount > 0) {
                // Transfer remaining collateral from protocol to loaner
                if (loanRecord.collateralTokenAddress == address(1)) {
                    configuration.payableProxy.sendETH(
                        loanRecord.ownerAddress,
                        localVars.remainingCollateralAmount
                    );
                } else {
                    ERC20(loanRecord.collateralTokenAddress).safeTransfer(
                        loanRecord.ownerAddress,
                        localVars.remainingCollateralAmount
                    );

                }
            }

            if (loanRecord.distributorAddress != address(this)) {
                if (loanRecord.loanTokenAddress == address(1)) {
                    configuration.payableProxy.sendETH(
                        loanRecord.distributorAddress,
                        loanRecord.distributorInterest
                    );
                } else {
                    ERC20(loanRecord.loanTokenAddress).safeTransfer(
                        loanRecord.distributorAddress,
                        loanRecord.distributorInterest
                    );
                }
            }
        }

        liquidityPools.repayLoanToPools(loanRecord, localVars.liquidatedAmount);

        // Transfer loan tokens from liquidator to protocol
        ERC20(loanRecord.loanTokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            localVars.liquidatedAmount
        );

        emit LiquidateLoanSucceed(
            msg.sender,
            loanId,
            localVars.liquidatedAmount
        );

        return (
            loanRecord.collateralAmount.sub(loanRecord.soldCollateralAmount),
            localVars.liquidatedAmount
        );
    }

    function _calculateRemainingDebt(IStruct.LoanRecord memory loanRecord)
        internal
        pure
        returns (uint256 remainingDebt)
    {
        return
            loanRecord
                .loanAmount
                .add(loanRecord.interest)
                .sub(loanRecord.alreadyPaidAmount)
                .sub(loanRecord.liquidatedAmount);
    }

    function getLoanAndCollateralTokenPairs(State storage self)
        external
        view
        returns (
            IStruct.LoanAndCollateralTokenPair[] memory loanAndCollateralTokenPairList
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
            loanTerm <= liquidityPools.poolGroups[tokenAddress].numPools,
            'LoanManager: Invalid loan term.'
        );
        return
            configuration.interestModel.getLoanInterestRate(
                tokenAddress,
                loanTerm,
                liquidityPools.poolGroups[tokenAddress].numPools
            );
    }
}
