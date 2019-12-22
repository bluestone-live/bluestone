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
import './AccountManager.sol';

library LoanManager {
    using Configuration for Configuration.State;
    using LiquidityPools for LiquidityPools.State;
    using DepositManager for DepositManager.State;
    using AccountManager for AccountManager.State;
    using SafeERC20 for ERC20;
    using SafeMath for uint256;
    using FixedMath for uint256;

    struct State {
        TokenStorage loanTokens;
        TokenStorage collateralTokens;
        // ID -> LoanRecord
        mapping(bytes32 => IStruct.LoanRecord) loanRecordById;
        // accountAddress -> loanIds
        mapping(address => bytes32[]) loanIdsByAccount;
        /// loan token -> collateral token -> enabled
        /// An loan token pair refers to loan token A using collateral B, i.e., "B -> A",
        /// Loan-related transactions can happen only if "B -> A" is enabled.
        mapping(address => mapping(address => bool)) isLoanTokenPairEnabled;
        /// loan token -> collateral token -> minimum collateral coverage ratios
        /// For example, if minCollateralCoverageRatios[DAI][ETH] = 1.5 when 1 ETH = 150 DAI, it means you
        /// can loan 100 DAI at most for colleteralize 1 ETH. And when the collateral coverage ratio of loan
        /// is below 1.5, the colleratal will be liquidated
        mapping(address => mapping(address => uint256)) minCollateralCoverageRatios;
        /// loan token -> collateral token -> liquidation discounts
        mapping(address => mapping(address => uint256)) liquidationDiscounts;
        uint256 numLoans;
    }

    struct TokenStorage {
        /// When referenceCounter < 0, the token was enabled as a loan token pair list before,
        /// but has been disabled and not existed in loan token pair list now.
        /// If referenceCounter == 0, the token never existed in loan token pair list.
        /// If referenceCounter > 0, the token exists in `referenceCounter` loan token pair list.
        mapping(address => int256) referenceCounter;
        /// an array store all token that have ever existed in loan token pair list.
        address[] tokenList;
    }

    uint256 private constant LOWER_BOUND_OF_CCR_FOR_ALL_PAIRS = 10**18; // 1.0 (100%)
    uint256 private constant ONE = 10**18;
    uint256 private constant MAX_LIQUIDATION_DISCOUNT = 2 * (10**17); // 0.2 (20%)

    struct LoanRecordListView {
        bytes32[] loanIdList;
        address[] loanTokenAddressList;
        address[] collateralTokenAddressList;
        uint256[] loanTermList;
        uint256[] loanAmountList;
        uint256[] collateralAmountList;
        uint256[] createdAtList;
    }

    struct LocalVars {
        bytes32 loanId;
        uint256 remainingCollateralAmount;
        uint256 remainingDebt;
        uint256 loanTokenPrice;
        uint256 collateralTokenPrice;
        uint256 currCollateralCoverageRatio;
        uint256 minCollateralCoverageRatio;
        uint256 loanInterestRate;
        uint256 liquidationDiscount;
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

    function getLoanRecordById(State storage self, bytes32 loanId)
        external
        view
        returns (IStruct.LoanRecord memory loanRecord)
    {
        IStruct.LoanRecord memory loanRecord = self.loanRecordById[loanId];

        require(
            loanRecord.loanTokenAddress != address(0),
            'LoanManager: Loan ID is invalid'
        );

        return loanRecord;

    }

    function getLoanRecordDetailsById(
        State storage self,
        Configuration.State storage configuration,
        bytes32 loanId
    )
        internal
        view
        returns (
            uint256 remainingDebt,
            uint256 currentCollateralRatio,
            bool isLiquidatable,
            bool isOverDue,
            bool isClosed
        )
    {
        IStruct.LoanRecord memory loanRecord = self.loanRecordById[loanId];

        require(
            loanRecord.loanTokenAddress != address(0),
            'LoanManager: Loan ID is invalid'
        );

        remainingDebt = _calculateRemainingDebt(loanRecord);

        if (loanRecord.isClosed) {
            // If loan is closed, collateral coverage ratio becomes meaningless
            currentCollateralRatio = 0;
        } else {
            uint256 collateralTokenPrice = configuration
                .priceOracleByToken[loanRecord.collateralTokenAddress]
                .getPrice();

            uint256 loanTokenPrice = configuration.priceOracleByToken[loanRecord
                .loanTokenAddress]
                .getPrice();

            currentCollateralRatio = loanRecord
                .collateralAmount
                .sub(loanRecord.soldCollateralAmount)
                .mulFixed(collateralTokenPrice)
                .divFixed(remainingDebt)
                .divFixed(loanTokenPrice);
        }

        isOverDue =
            now >
            loanRecord.createdAt.add(
                loanRecord.loanTerm.mul(DateTime.dayInSeconds())
            );

        isLiquidatable =
            (currentCollateralRatio < loanRecord.minCollateralCoverageRatio) ||
            isOverDue;

        return (
            remainingDebt,
            currentCollateralRatio,
            isLiquidatable,
            isOverDue,
            loanRecord.isClosed
        );
    }

    function getLoanRecordsByAccount(State storage self, address accountAddress)
        external
        view
        returns (IStruct.LoanRecord[] memory loanRecordList)
    {
        bytes32[] memory loanIdList = self.loanIdsByAccount[accountAddress];
        loanRecordList = new IStruct.LoanRecord[](loanIdList.length);

        for (uint256 i = 0; i < loanIdList.length; i++) {
            loanRecordList[i] = self.loanRecordById[loanIdList[i]];
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
        require(
            self.isLoanTokenPairEnabled[loanParameters
                .loanTokenAddress][loanParameters.collateralTokenAddress],
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
        localVars.liquidationDiscount = self.liquidationDiscounts[loanParameters
            .loanTokenAddress][loanParameters.collateralTokenAddress];
        localVars.minCollateralCoverageRatio = self
            .minCollateralCoverageRatios[loanParameters
            .loanTokenAddress][loanParameters.collateralTokenAddress];
        localVars.loanInterest = loanParameters
            .loanAmount
            .mulFixed(localVars.loanInterestRate)
            .mul(loanParameters.loanTerm)
            .div(365);

        localVars.loanTokenPrice = configuration
            .priceOracleByToken[loanParameters.loanTokenAddress]
            .getPrice();

        localVars.collateralTokenPrice = configuration
            .priceOracleByToken[loanParameters.collateralTokenAddress]
            .getPrice();

        localVars.currCollateralCoverageRatio = loanParameters
            .collateralAmount
            .mulFixed(localVars.collateralTokenPrice)
            .divFixed(loanParameters.loanAmount.add(localVars.loanInterest))
            .divFixed(localVars.loanTokenPrice);

        require(
            localVars.currCollateralCoverageRatio >=
                localVars.minCollateralCoverageRatio,
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
            minCollateralCoverageRatio: localVars.minCollateralCoverageRatio,
            liquidationDiscount: localVars.liquidationDiscount,
            alreadyPaidAmount: 0,
            liquidatedAmount: 0,
            soldCollateralAmount: 0,
            createdAt: now,
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

    function addToLoanStat(
        State storage,
        AccountManager.State storage accountManager,
        address loanTokenAddress,
        uint256 loanAmount
    ) external {
        accountManager.addToAccountGeneralStat(msg.sender, 'numberOfLoans', 1);
        accountManager.addToAccountTokenStat(
            msg.sender,
            loanTokenAddress,
            'numberOfLoans',
            1
        );
        accountManager.addToAccountTokenStat(
            msg.sender,
            loanTokenAddress,
            'totalLoanAmount',
            loanAmount
        );
    }

    function enableLoanAndCollateralTokenPair(
        State storage self,
        address loanTokenAddress,
        address collateralTokenAddress
    ) external {
        require(
            loanTokenAddress != collateralTokenAddress,
            'LoanManager: two tokens must be different.'
        );
        require(
            !self
                .isLoanTokenPairEnabled[loanTokenAddress][collateralTokenAddress],
            'LoanManager: loan token pair is already enabled.'
        );
        self
            .isLoanTokenPairEnabled[loanTokenAddress][collateralTokenAddress] = true;

        if (self.loanTokens.referenceCounter[loanTokenAddress] == 0) {
            self.loanTokens.tokenList.push(loanTokenAddress);
            self.loanTokens.referenceCounter[loanTokenAddress]++;
        } else if (self.loanTokens.referenceCounter[loanTokenAddress] < 0) {
            self.loanTokens.referenceCounter[loanTokenAddress] = 1;
        } else {
            self.loanTokens.referenceCounter[loanTokenAddress]++;
        }

        if (
            self.collateralTokens.referenceCounter[collateralTokenAddress] == 0
        ) {
            self.collateralTokens.tokenList.push(collateralTokenAddress);
            self.collateralTokens.referenceCounter[collateralTokenAddress]++;
        } else if (
            self.collateralTokens.referenceCounter[collateralTokenAddress] < 0
        ) {
            self.collateralTokens.referenceCounter[collateralTokenAddress] = 1;
        } else {
            self.collateralTokens.referenceCounter[collateralTokenAddress]++;
        }
    }

    function disableLoanAndCollateralTokenPair(
        State storage self,
        address loanTokenAddress,
        address collateralTokenAddress
    ) external {
        require(
            self
                .isLoanTokenPairEnabled[loanTokenAddress][collateralTokenAddress],
            'LoanManager: loan token pair is already disabled.'
        );
        require(
            self.loanTokens.referenceCounter[loanTokenAddress] > 0,
            'LoanManager: the reference counter must be larger than 0.'
        );
        require(
            self.collateralTokens.referenceCounter[collateralTokenAddress] > 0,
            'LoanManager: the reference counter must be larger than 0.'
        );

        self
            .isLoanTokenPairEnabled[loanTokenAddress][collateralTokenAddress] = false;

        if (self.loanTokens.referenceCounter[loanTokenAddress] == 1) {
            self.loanTokens.referenceCounter[loanTokenAddress] = -1;
        } else {
            self.loanTokens.referenceCounter[loanTokenAddress]--;
        }

        if (
            self.collateralTokens.referenceCounter[collateralTokenAddress] == 1
        ) {
            self.collateralTokens.referenceCounter[collateralTokenAddress] = -1;
        } else {
            self.collateralTokens.referenceCounter[collateralTokenAddress]--;
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

        require(
            self.isLoanTokenPairEnabled[loanRecord.loanTokenAddress][loanRecord
                .collateralTokenAddress],
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

        require(
            self.isLoanTokenPairEnabled[loanRecord.loanTokenAddress][loanRecord
                .collateralTokenAddress],
            'LoanManager: invalid loan and collateral token pair'
        );

        require(
            msg.sender != loanRecord.ownerAddress,
            'LoanManager: invalid user'
        );

        require(!loanRecord.isClosed, 'LoanManager: loan already closed');

        LocalVars memory localVars;
        localVars.loanTokenPrice = configuration.priceOracleByToken[loanRecord
            .loanTokenAddress]
            .getPrice();
        localVars.collateralTokenPrice = configuration
            .priceOracleByToken[loanRecord.collateralTokenAddress]
            .getPrice();

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

        // TODO(desmond): increment stat if loan is overdue

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

    function setMinCollateralCoverageRatiosForToken(
        State storage self,
        address loanTokenAddress,
        address[] calldata collateralTokenAddressList,
        uint256[] calldata minCollateralCoverageRatioList
    ) external {
        require(
            collateralTokenAddressList.length ==
                minCollateralCoverageRatioList.length,
            "LoanManager: Arrays' length must be the same."
        );
        for (uint256 i = 0; i < minCollateralCoverageRatioList.length; i++) {
            require(
                self
                    .isLoanTokenPairEnabled[loanTokenAddress][collateralTokenAddressList[i]],
                'LoanManager: The token pair must be enabled.'
            );
            require(
                minCollateralCoverageRatioList[i] >
                    LOWER_BOUND_OF_CCR_FOR_ALL_PAIRS,
                'LoanManager: Minimum CCR must be larger than lower bound.'
            );
        }

        for (uint256 i = 0; i < minCollateralCoverageRatioList.length; i++) {
            self
                .minCollateralCoverageRatios[loanTokenAddress][collateralTokenAddressList[i]] = minCollateralCoverageRatioList[i];
        }
    }

    function setLiquidationDiscountsForToken(
        State storage self,
        address loanTokenAddress,
        address[] calldata collateralTokenAddressList,
        uint256[] calldata liquidationDiscountList
    ) external {
        require(
            collateralTokenAddressList.length == liquidationDiscountList.length,
            "LoanManager: Arrays' length must be the same."
        );
        for (uint256 i = 0; i < liquidationDiscountList.length; i++) {
            require(
                self
                    .isLoanTokenPairEnabled[loanTokenAddress][collateralTokenAddressList[i]],
                'LoanManager: The token pair must be enabled.'
            );
            require(
                liquidationDiscountList[i] < MAX_LIQUIDATION_DISCOUNT,
                'LoanManager: discount must be smaller than MAX_LIQUIDATION_DISCOUNT.'
            );
        }

        for (uint256 i = 0; i < liquidationDiscountList.length; i++) {
            self
                .liquidationDiscounts[loanTokenAddress][collateralTokenAddressList[i]] = liquidationDiscountList[i];
        }
    }

    function getLoanAndCollateralTokenPairs(State storage self)
        external
        view
        returns (
            IStruct.LoanAndCollateralTokenPair[] memory loanAndCollateralTokenPairList
        )
    {
        loanAndCollateralTokenPairList = new IStruct.LoanAndCollateralTokenPair[](
            self.loanTokens.tokenList.length.mul(
                self.collateralTokens.tokenList.length
            )
        );

        address loanTokenAddress;
        address collateralTokenAddress;
        uint256 i;

        for (uint256 m = 0; m < self.loanTokens.tokenList.length; m++) {
            loanTokenAddress = self.loanTokens.tokenList[m];

            for (
                uint256 n = 0;
                n < self.collateralTokens.tokenList.length;
                n++
            ) {
                collateralTokenAddress = self.collateralTokens.tokenList[n];

                loanAndCollateralTokenPairList[i] = IStruct
                    .LoanAndCollateralTokenPair({
                    isEnabled: self
                        .isLoanTokenPairEnabled[loanTokenAddress][collateralTokenAddress],
                    loanTokenAddress: loanTokenAddress,
                    collateralTokenAddress: collateralTokenAddress,
                    minCollateralCoverageRatio: self
                        .minCollateralCoverageRatios[loanTokenAddress][collateralTokenAddress],
                    liquidationDiscount: self
                        .liquidationDiscounts[loanTokenAddress][collateralTokenAddress]
                });

                i++;
            }
        }

        return loanAndCollateralTokenPairList;
    }

    function getTokenAddressList(State storage self, uint256 tokenType)
        external
        view
        returns (address[] memory tokenAddressList, bool[] memory isActive)
    {
        if (tokenType == 0) {
            tokenAddressList = self.loanTokens.tokenList;
            isActive = new bool[](self.loanTokens.tokenList.length);
            for (uint256 i = 0; i < isActive.length; i++) {
                isActive[i] =
                    self.loanTokens.referenceCounter[self
                        .loanTokens
                        .tokenList[i]] >
                    0;
            }
        } else if (tokenType == 1) {
            tokenAddressList = self.collateralTokens.tokenList;
            isActive = new bool[](self.collateralTokens.tokenList.length);
            for (uint256 i = 0; i < isActive.length; i++) {
                isActive[i] =
                    self.collateralTokens.referenceCounter[self
                        .collateralTokens
                        .tokenList[i]] >
                    0;
            }
        }
        return (tokenAddressList, isActive);
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
