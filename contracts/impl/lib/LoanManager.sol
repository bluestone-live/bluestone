pragma solidity ^0.6.0;

import '../ERC20.sol';
import '../../lib/Math.sol';
import '../../lib/SafeMath.sol';
import '../../lib/FixedMath.sol';
import '../../lib/DateTime.sol';
import '../../lib/SafeERC20.sol';
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
        mapping(bytes32 => LoanRecord) loanRecordById;
        // accountAddress -> loanIds
        mapping(address => bytes32[]) loanIdsByAccount;
        // account -> tokenAddress -> availableCollateralamount
        mapping(address => mapping(address => uint256)) availableCollateralsByAccount;
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

    struct LoanRecord {
        bool isValid;
        bytes32 loanId;
        address ownerAddress;
        address loanTokenAddress;
        address collateralTokenAddress;
        uint256 loanAmount;
        uint256 collateralAmount;
        uint256 loanTerm;
        uint256 annualInterestRate;
        uint256 interest;
        uint256 minCollateralCoverageRatio;
        uint256 liquidationDiscount;
        uint256 alreadyPaidAmount;
        uint256 liquidatedAmount;
        uint256 soldCollateralAmount;
        uint256 createdAt;
        uint256 lastInterestUpdatedAt;
        uint256 lastRepaidAt;
        uint256 lastLiquidatedAt;
        bool isClosed;
        // pool id -> loan amount
        /// How much have one borrowed from a pool
        mapping(uint256 => uint256) loanAmountByPool;
        address distributorAddress;
        uint256 distributorInterest;
    }

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
        uint256 availableCollateral;
        uint256 maxLoanTerm;
        bool isUnderCollateralCoverageRatio;
        bool isOverDue;
    }

    struct LoanParameters {
        address loanTokenAddress;
        address collateralTokenAddress;
        uint256 loanAmount;
        uint256 collateralAmount;
        uint256 loanTerm;
        bool useAvailableCollateral;
        address distributorAddress;
        uint256 loanDistributorFeeRatio;
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
    event WithdrawAvailableCollateralSucceed(
        address indexed accountAddress,
        uint256 amount
    );
    event AddCollateralSucceed(
        address indexed accountAddress,
        bytes32 indexed recordId,
        uint256 amount
    );

    function getLoanRecordById(State storage self, bytes32 loanId)
        external
        view
        returns (
            address loanTokenAddress,
            address collateralTokenAddress,
            uint256 loanTerm,
            uint256 loanAmount,
            uint256 collateralAmount,
            uint256 createdAt
        )
    {
        LoanRecord memory loanRecord = self.loanRecordById[loanId];

        require(
            loanRecord.loanTokenAddress != address(0),
            'LoanManager: Loan ID is invalid'
        );

        return (
            loanRecord.loanTokenAddress,
            loanRecord.collateralTokenAddress,
            loanRecord.loanTerm,
            loanRecord.loanAmount,
            loanRecord.collateralAmount,
            loanRecord.createdAt
        );
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
        LoanRecord memory loanRecord = self.loanRecordById[loanId];
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
            loanRecord.createdAt +
                loanRecord.loanTerm *
                DateTime.dayInSeconds();

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
        returns (
            bytes32[] memory loanIdList,
            address[] memory loanTokenAddressList,
            address[] memory collateralTokenAddressList,
            uint256[] memory loanTermList,
            uint256[] memory loanAmountList,
            uint256[] memory collateralAmountList,
            uint256[] memory createdAtList
        )
    {
        LoanRecordListView memory loanRecordListView;
        loanRecordListView.loanIdList = self.loanIdsByAccount[accountAddress];
        if (loanRecordListView.loanIdList.length != 0) {
            loanRecordListView.loanTokenAddressList = new address[](
                loanRecordListView.loanIdList.length
            );
            loanRecordListView.collateralTokenAddressList = new address[](
                loanRecordListView.loanIdList.length
            );
            loanRecordListView.loanTermList = new uint256[](
                loanRecordListView.loanIdList.length
            );
            loanRecordListView.loanAmountList = new uint256[](
                loanRecordListView.loanIdList.length
            );
            loanRecordListView.collateralAmountList = new uint256[](
                loanRecordListView.loanIdList.length
            );
            loanRecordListView.createdAtList = new uint256[](
                loanRecordListView.loanIdList.length
            );
            for (uint256 i = 0; i < loanRecordListView.loanIdList.length; i++) {
                LoanRecord memory loanRecord = self
                    .loanRecordById[loanRecordListView.loanIdList[i]];
                loanRecordListView.loanTokenAddressList[i] = loanRecord
                    .loanTokenAddress;
                loanRecordListView.collateralTokenAddressList[i] = loanRecord
                    .collateralTokenAddress;
                loanRecordListView.loanTermList[i] = loanRecord.loanTerm;
                loanRecordListView.loanAmountList[i] = loanRecord.loanAmount;
                loanRecordListView.collateralAmountList[i] = loanRecord
                    .collateralAmount;
                loanRecordListView.createdAtList[i] = loanRecord.createdAt;
            }
        }
        return (
            loanRecordListView.loanIdList,
            loanRecordListView.loanTokenAddressList,
            loanRecordListView.collateralTokenAddressList,
            loanRecordListView.loanTermList,
            loanRecordListView.loanAmountList,
            loanRecordListView.collateralAmountList,
            loanRecordListView.createdAtList
        );
    }

    function addCollateral(
        State storage self,
        bytes32 loanId,
        uint256 collateralAmount,
        bool useAvailableCollateral
    ) external returns (uint256 totalCollateralAmount) {
        require(
            !self.loanRecordById[loanId].isClosed,
            'LoanManager: loan is closed'
        );

        uint256 remainingCollateralAmount = collateralAmount;
        address collateralTokenAddress = self.loanRecordById[loanId]
            .collateralTokenAddress;

        if (useAvailableCollateral) {
            uint256 availableCollateral = subtractAvailableCollateral(
                self,
                msg.sender,
                collateralTokenAddress,
                collateralAmount
            );
            remainingCollateralAmount -= availableCollateral;
        }

        // Transfer remaining amount from user account to protocol
        if (remainingCollateralAmount > 0) {
            ERC20(collateralTokenAddress).safeTransferFrom(
                msg.sender,
                address(this),
                remainingCollateralAmount
            );
        }

        self.loanRecordById[loanId].collateralAmount = self
            .loanRecordById[loanId]
            .collateralAmount
            .add(collateralAmount);

        emit AddCollateralSucceed(msg.sender, loanId, collateralAmount);

        return self.loanRecordById[loanId].collateralAmount;
    }

    function getAvailableCollateralsByAccount(
        State storage self,
        address accountAddress
    )
        external
        view
        returns (
            address[] memory tokenAddressList,
            uint256[] memory availableCollateralAmountList
        )
    {
        availableCollateralAmountList = new uint256[](
            self.collateralTokens.tokenList.length
        );
        for (uint256 i = 0; i < self.collateralTokens.tokenList.length; i++) {
            availableCollateralAmountList[i] = self
                .availableCollateralsByAccount[accountAddress][self
                .collateralTokens
                .tokenList[i]];
        }
        return (self.collateralTokens.tokenList, availableCollateralAmountList);
    }

    function withdrawAvailableCollateral(
        State storage self,
        address tokenAddress,
        uint256 collateralAmount
    ) external {
        uint256 availableCollateral = self.availableCollateralsByAccount[msg
            .sender][tokenAddress];

        require(
            availableCollateral >= collateralAmount,
            'LoanManager: available collateral amount is not enough'
        );

        self.availableCollateralsByAccount[msg
            .sender][tokenAddress] = availableCollateral.sub(collateralAmount);

        // Transfer token from protocol to user.
        ERC20(tokenAddress).safeTransfer(msg.sender, collateralAmount);

        // Emit the remaining available collateral amount
        emit WithdrawAvailableCollateralSucceed(
            msg.sender,
            self.availableCollateralsByAccount[msg.sender][tokenAddress]
        );
    }

    function addAvailableCollateral(
        State storage self,
        address accountAddress,
        address tokenAddress,
        uint256 amount
    ) internal {
        self.availableCollateralsByAccount[accountAddress][tokenAddress] = self
            .availableCollateralsByAccount[accountAddress][tokenAddress]
            .add(amount);
    }

    function subtractAvailableCollateral(
        State storage self,
        address accountAddress,
        address tokenAddress,
        uint256 amount
    ) internal returns (uint256) {
        require(
            amount > 0,
            'LoanManager: The decrease in available collateral amount must be greater than 0.'
        );

        uint256 availableCollateral = Math.min(
            self.availableCollateralsByAccount[accountAddress][tokenAddress],
            amount
        );

        self.availableCollateralsByAccount[accountAddress][tokenAddress] = self
            .availableCollateralsByAccount[accountAddress][tokenAddress]
            .sub(availableCollateral);

        return availableCollateral;
    }

    // TODO(ZhangRGK): We may need to combining params into one parameter struct
    function loan(
        State storage self,
        Configuration.State storage configuration,
        LiquidityPools.State storage liquidityPools,
        LoanParameters storage loanParameters
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
        require(
            loanParameters.loanDistributorFeeRatio <=
                configuration.maxLoanDistributorFeeRatio,
            'LoanManager: invalid loan distributor fee ratio'
        );

        localVars.remainingCollateralAmount = loanParameters.collateralAmount;

        if (loanParameters.useAvailableCollateral) {
            localVars.availableCollateral = subtractAvailableCollateral(
                self,
                msg.sender,
                loanParameters.collateralTokenAddress,
                loanParameters.collateralAmount
            );

            localVars.remainingCollateralAmount = localVars
                .remainingCollateralAmount
                .sub(localVars.availableCollateral);
        }

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

        self.loanRecordById[localVars.loanId] = LoanRecord({
            isValid: true,
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

        // Transfer collateral tokens from loaner to protocol
        ERC20(loanParameters.collateralTokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            localVars.remainingCollateralAmount
        );

        // Transfer loan tokens from protocol to loaner
        ERC20(loanParameters.loanTokenAddress).safeTransfer(
            msg.sender,
            loanParameters.loanAmount
        );

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
        bytes32 loanId,
        uint256 repayAmount
    ) external returns (uint256 remainingDebt) {
        LoanRecord storage loanRecord = self.loanRecordById[loanId];

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

        // Transfer loan tokens from user to protocol
        ERC20(loanRecord.loanTokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            repayAmount
        );

        if (_calculateRemainingDebt(loanRecord) == 0) {
            loanRecord.isClosed = true;
            uint256 availableCollateralAmount = loanRecord.collateralAmount.sub(
                loanRecord.soldCollateralAmount
            );

            if (availableCollateralAmount > 0) {
                // Add available collateral to loaner's account
                addAvailableCollateral(
                    self,
                    msg.sender,
                    loanRecord.collateralTokenAddress,
                    availableCollateralAmount
                );
            }

            if (loanRecord.distributorAddress != address(this)) {
                // Transfer loan distributor fee to distributor
                ERC20(loanRecord.loanTokenAddress).safeTransfer(
                    loanRecord.distributorAddress,
                    loanRecord.distributorInterest
                );
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
        LoanRecord storage loanRecord = self.loanRecordById[loanId];

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
            loanRecord.createdAt +
                loanRecord.loanTerm *
                DateTime.dayInSeconds();

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

            uint256 availableCollateralAmount = loanRecord.collateralAmount.sub(
                loanRecord.soldCollateralAmount
            );

            if (availableCollateralAmount > 0) {
                // Add available collateral to loaner's account
                addAvailableCollateral(
                    self,
                    loanRecord.ownerAddress,
                    loanRecord.collateralTokenAddress,
                    availableCollateralAmount
                );
            }

            if (loanRecord.distributorAddress != address(this)) {
                // Transfer loan distributor fee to distributor
                ERC20(loanRecord.loanTokenAddress).safeTransfer(
                    loanRecord.distributorAddress,
                    loanRecord.distributorInterest
                );
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

    function _calculateRemainingDebt(LoanRecord memory loanRecord)
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
            address[] memory loanTokenAddressList,
            address[] memory collateralTokenAddressList,
            bool[] memory isEnabledList,
            uint256[] memory minCollateralCoverageRatioList,
            uint256[] memory liquidationDiscountList
        )
    {
        loanTokenAddressList = self.loanTokens.tokenList;
        collateralTokenAddressList = self.collateralTokens.tokenList;
        uint256 loanLen = loanTokenAddressList.length;
        uint256 collateralLen = collateralTokenAddressList.length;
        isEnabledList = new bool[](loanLen * collateralLen);
        minCollateralCoverageRatioList = new uint256[](loanLen * collateralLen);
        liquidationDiscountList = new uint256[](loanLen * collateralLen);
        uint256 k = 0;
        for (uint256 i = 0; i < loanLen; ++i) {
            for (uint256 j = 0; j < collateralLen; j++) {
                isEnabledList[k] = self
                    .isLoanTokenPairEnabled[loanTokenAddressList[i]][collateralTokenAddressList[j]];
                minCollateralCoverageRatioList[k] = self
                    .minCollateralCoverageRatios[loanTokenAddressList[i]][collateralTokenAddressList[j]];
                liquidationDiscountList[k] = self
                    .liquidationDiscounts[loanTokenAddressList[i]][collateralTokenAddressList[j]];
                k++;
            }
        }
        // The returned result needs to be matched by Cartesian product
        return (
            loanTokenAddressList,
            collateralTokenAddressList,
            isEnabledList,
            minCollateralCoverageRatioList,
            liquidationDiscountList
        );
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
