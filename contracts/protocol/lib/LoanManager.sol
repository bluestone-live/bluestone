pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '../../common/ERC20.sol';
import '../../common/lib/Math.sol';
import '../../common/lib/SafeMath.sol';
import '../../common/lib/FixedMath.sol';
import '../../common/lib/DateTime.sol';
import '../../common/lib/SafeERC20.sol';
import '../interface/IStruct.sol';
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
    event LoanDistributorFeeTransfered(
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

        require(
            loanRecord.loanTokenAddress != address(0),
            'LoanManager: invalid loan ID'
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

        IStruct.LoanAndCollateralTokenPair storage tokenPair = self
            .loanAndCollateralTokenPairs[record.loanTokenAddress][record
            .collateralTokenAddress];

        require(
            tokenPair.minCollateralCoverageRatio != 0,
            'LoanManager: invalid token pair'
        );

        address collateralTokenAddress = record.collateralTokenAddress;

        if (collateralTokenAddress != address(1)) {
            // Transfer collateral from user account to protocol
            ERC20(collateralTokenAddress).safeTransferFrom(
                msg.sender,
                address(this),
                collateralAmount
            );
        }

        record.collateralAmount = record.collateralAmount.add(collateralAmount);

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
            .loanAndCollateralTokenPairs[record.loanTokenAddress][record
            .collateralTokenAddress];

        require(
            tokenPair.minCollateralCoverageRatio != 0,
            'LoanManager: invalid token pair'
        );

        IPriceOracle loanTokenPriceOracle = configuration
            .priceOracleByToken[record.loanTokenAddress];
        IPriceOracle collateralTokenPriceOracle = configuration
            .priceOracleByToken[record.collateralTokenAddress];

        loanTokenPriceOracle.updatePriceIfNeeded();
        collateralTokenPriceOracle.updatePriceIfNeeded();

        uint256 collateralCoverageRatioAfterSubtraction = record
            .collateralAmount
            .sub(record.soldCollateralAmount)
            .sub(collateralAmount)
            .mulFixed(collateralTokenPriceOracle.getPrice())
            .divFixed(_calculateRemainingDebt(record))
            .divFixed(loanTokenPriceOracle.getPrice());

        require(
            collateralCoverageRatioAfterSubtraction >=
                tokenPair.minCollateralCoverageRatio,
            'LoanManager: invalid collateral coverage ratio after subtraction'
        );

        // Transfer collateral from protocol to user
        if (record.collateralTokenAddress == address(1)) {
            msg.sender.transfer(collateralAmount);
        } else {
            ERC20(record.collateralTokenAddress).safeTransfer(
                msg.sender,
                collateralAmount
            );
        }

        record.collateralAmount = record.collateralAmount.sub(collateralAmount);

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
            .loanAndCollateralTokenPairs[loanParameters
            .loanTokenAddress][loanParameters.collateralTokenAddress];

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

        LocalVars memory localVars;
        localVars.maxLoanTerm = liquidityPools.poolGroupSize;

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
            'LoanManager: invalid collateral coverage ratio'
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
            msg.sender.transfer(loanParameters.loanAmount);
        } else {
            // Transfer loan tokens from protocol to loaner
            ERC20(loanParameters.loanTokenAddress).safeTransfer(
                msg.sender,
                loanParameters.loanAmount
            );
        }

        if (loanParameters.collateralTokenAddress != address(1)) {
            // If collateral token is not ETH, ensure msg.value is 0
            require(msg.value == 0, 'LoanManager: msg.value is not accepted');

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
            loanParameters.loanTokenAddress,
            loanParameters.loanAmount,
            loanParameters.collateralTokenAddress,
            loanParameters.collateralAmount
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
                .loanAndCollateralTokenPairs[loanTokenAddress][collateralTokenAddress]
                .minCollateralCoverageRatio == 0
        ) {
            self.loanAndCollateralTokenPairList.push(tokenPair);
        }

        self
            .loanAndCollateralTokenPairs[loanTokenAddress][collateralTokenAddress] = tokenPair;

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
            .loanAndCollateralTokenPairs[loanTokenAddress][collateralTokenAddress];

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

                delete self
                    .loanAndCollateralTokenPairs[loanTokenAddress][collateralTokenAddress];

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

        uint256 currRemainingDebt = _calculateRemainingDebt(loanRecord);

        require(
            repayAmount <= currRemainingDebt,
            'LoanManager: invalid repay amount'
        );

        if (loanRecord.loanTokenAddress != address(1)) {
            require(msg.value == 0, 'LoanManager: msg.value is not accepted');

            ERC20(loanRecord.loanTokenAddress).safeTransferFrom(
                msg.sender,
                address(this),
                repayAmount
            );
        }

        uint256 repayAmountToPools;
        uint256 loanDistributorFeeRatio;

        if (loanRecord.interest > 0) {
            loanDistributorFeeRatio = loanRecord.distributorInterest.divFixed(
                loanRecord.interest
            );
        }

        /// In repay process. we need to ensure that the loan distribution fee can't be lent
        /// So we should determine if user repays interest each time
        if (loanRecord.alreadyPaidAmount >= loanRecord.loanAmount) {
            // Only repays interest
            repayAmountToPools = repayAmount.mulFixed(
                ONE.sub(loanDistributorFeeRatio)
            );
        } else if (
            loanRecord.alreadyPaidAmount.add(repayAmount) >
            loanRecord.loanAmount
        ) {
            // Repays interest and principal
            uint256 remainingPrincipal = loanRecord.loanAmount.sub(
                loanRecord.alreadyPaidAmount
            );
            repayAmountToPools = remainingPrincipal.add(
                repayAmount.sub(remainingPrincipal).mulFixed(
                    ONE.sub(loanDistributorFeeRatio)
                )
            );
        } else {
            // Only repays principal
            repayAmountToPools = repayAmount;
        }

        liquidityPools.repayLoanToPools(loanRecord, repayAmountToPools);

        loanRecord.alreadyPaidAmount = loanRecord.alreadyPaidAmount.add(
            repayAmount
        );
        loanRecord.lastRepaidAt = now;
        uint256 remainingCollateralAmount;

        if (_calculateRemainingDebt(loanRecord) == 0) {
            loanRecord.isClosed = true;

            remainingCollateralAmount = loanRecord.collateralAmount.sub(
                loanRecord.soldCollateralAmount
            );

            if (remainingCollateralAmount > 0) {
                // Transfer remaining collateral from protocol to loaner
                if (loanRecord.collateralTokenAddress == address(1)) {
                    msg.sender.transfer(remainingCollateralAmount);
                } else {
                    ERC20(loanRecord.collateralTokenAddress).safeTransfer(
                        msg.sender,
                        remainingCollateralAmount
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
            loanRecord.isClosed ? remainingCollateralAmount : 0,
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
        IStruct.LoanAndCollateralTokenPair storage tokenPair = self
            .loanAndCollateralTokenPairs[loanRecord.loanTokenAddress][loanRecord
            .collateralTokenAddress];

        require(
            tokenPair.minCollateralCoverageRatio != 0,
            'LoanManager: invalid token pair'
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

        localVars.remainingCollateralAmount = loanRecord.collateralAmount.sub(
            loanRecord.soldCollateralAmount
        );

        localVars.soldCollateralAmount = Math.min(
            localVars
                .liquidatedAmount
                .mulFixed(localVars.loanTokenPrice)
                .divFixed(localVars.collateralTokenPrice)
                .divFixed(ONE.sub(loanRecord.liquidationDiscount)),
            localVars.remainingCollateralAmount
        );

        // Transfer loan tokens from liquidator to protocol
        if (loanRecord.loanTokenAddress != address(1)) {
            require(msg.value == 0, 'LoanManager: msg.value is not accepted');

            ERC20(loanRecord.loanTokenAddress).safeTransferFrom(
                msg.sender,
                address(this),
                localVars.liquidatedAmount
            );
        }

        loanRecord.soldCollateralAmount = loanRecord.soldCollateralAmount.add(
            localVars.soldCollateralAmount
        );
        loanRecord.liquidatedAmount = loanRecord.liquidatedAmount.add(
            localVars.liquidatedAmount
        );
        loanRecord.lastLiquidatedAt = now;

        localVars.remainingCollateralAmount = loanRecord.collateralAmount.sub(
            loanRecord.soldCollateralAmount
        );

        if (
            localVars.remainingCollateralAmount == 0 ||
            _calculateRemainingDebt(loanRecord) == 0
        ) {
            // Close the loan if collateral or debt is clear
            loanRecord.isClosed = true;

            if (localVars.remainingCollateralAmount > 0) {
                // Transfer remaining collateral from protocol to loaner
                if (loanRecord.collateralTokenAddress == address(1)) {
                    loanRecord.ownerAddress.transfer(
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
                _payDistributorInterest(loanRecord);
            }
        }

        liquidityPools.repayLoanToPools(loanRecord, localVars.liquidatedAmount);

        // Transfer collateral amount to liquidator
        if (loanRecord.collateralTokenAddress == address(1)) {
            msg.sender.transfer(localVars.soldCollateralAmount);
        } else {
            ERC20(loanRecord.collateralTokenAddress).safeTransfer(
                msg.sender,
                localVars.soldCollateralAmount
            );
        }

        emit LiquidateLoanSucceed(
            msg.sender,
            loanId,
            loanRecord.loanTokenAddress,
            localVars.liquidatedAmount,
            loanRecord.collateralTokenAddress,
            localVars.soldCollateralAmount
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

    function _payDistributorInterest(IStruct.LoanRecord memory loanRecord)
        private
    {
        bool succeed = true;

        if (loanRecord.loanTokenAddress == address(1)) {
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
            emit LoanDistributorFeeTransfered(
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
}
