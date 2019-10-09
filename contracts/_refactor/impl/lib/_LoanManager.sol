pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/math/Math.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import '../../lib/FixedMath.sol';
import '../../lib/DateTime.sol';
import '../_PriceOracle.sol';
import './_Configuration.sol';
import './_LiquidityPools.sol';
import './_DepositManager.sol';

// TODO(desmond): remove `_` after contract refactor is complete.
library _LoanManager {
    using _Configuration for _Configuration.State;
    using _LiquidityPools for _LiquidityPools.State;
    using _DepositManager for _DepositManager.State;
    using SafeERC20 for ERC20;
    using SafeMath for uint256;
    using FixedMath for uint256;
    using SafeERC20 for ERC20;

    struct State {
        uint256[] loanTermList;
        TokenStorage loanTokens;
        TokenStorage collateralTokens;
        mapping(uint256 => bool) isLoanTermValid;
        // ID -> LoanRecord
        mapping(bytes32 => LoanRecord) loanRecordById;
        // accountAddress -> loanIds
        mapping(address => bytes32[]) loanIdsByAccount;
        // TODO(ZhangRGK): I need a collateral token list in account manager, I will merge it after loan pair finished
        address[] collateralTokenList;
        // account -> tokenAddress -> freedCollateralamount
        mapping(address => mapping(address => uint256)) freedCollateralsByAccount;
        /// loan token -> collateral token -> enabled
        /// An loan token pair refers to loan token A using collateral B, i.e., "B -> A",
        /// Loan-related transactions can happen only if "B -> A" is enabled.
        mapping(address => mapping(address => bool)) isLoanTokenPairEnabled;
        /// loan token -> collateral token -> minimum collateral coverage ratios
        /// For example, if minCollateralCoverageRatios[DAI][ETH] = 1.5 when 1 ETH = 150 DAI, it means you
        /// can loan 100 DAI at most for colleteralize 1 ETH. And when the collateral coverage ratio of loan
        /// is below 1.5, the colleratal will be liquidated
        mapping(address => mapping(address => uint256)) minCollateralCoverageRatios;
        /// loan token -> term -> loan interest rates
        mapping(address => mapping(uint256 => uint256)) loanInterestRates;
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

    uint256 private constant DAY_IN_SECONDS = 86400;
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
        // deposit term -> pool id -> loan amount
        /// How much have one borrowed from a pool in a specific pool group
        mapping(uint256 => mapping(uint256 => uint256)) loanAmountByPool;
    }

    struct LoanRecordListView {
        bytes32[] loanIdList;
        address[] loanTokenAddressList;
        address[] collateralTokenAddressList;
        uint256[] loanTermList;
        uint256[] remainingDebtList;
        uint256[] createdAtList;
        uint256[] currentCollateralRatioList;
        bool[] isClosedList;
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
        bool isUnderCollateralCoverageRatio;
        bool isOverDue;
    }

    event LoanSucceed(address indexed accountAddress, bytes32 loanId);
    event RepayLoanSucceed(address indexed accountAddress, bytes32 loanId);
    event LiquidateLoanSucceed(address indexed accountAddress, bytes32 loanId);
    event WithdrawFreedCollateralSucceed(
        address indexed accountAddress,
        uint256 amount
    );
    event AddCollateralSucceed(
        address indexed accountAddress,
        bytes32 indexed loanId,
        uint256 amount
    );

    function addLoanTerm(
        State storage self,
        _LiquidityPools.State storage liquidityPools,
        _DepositManager.State storage depositManager,
        uint256 loanTerm
    ) external {
        require(
            !self.isLoanTermValid[loanTerm],
            'LoanManager: term already exists'
        );

        self.loanTermList.push(loanTerm);
        self.isLoanTermValid[loanTerm] = true;

        address[] memory depositTokenAddressList = depositManager
            .enabledDepositTokenAddressList;

        for (uint256 i = 0; i < depositTokenAddressList.length; i++) {
            liquidityPools.updateAvailableAmountByTerm(
                depositTokenAddressList[i],
                depositManager.enabledDepositTermList,
                loanTerm
            );
        }
    }

    function removeLoanTerm(State storage self, uint256 loanTerm) external {
        require(
            self.isLoanTermValid[loanTerm],
            'LoanManager: term does not exist'
        );

        self.isLoanTermValid[loanTerm] = false;

        for (uint256 i = 0; i < self.loanTermList.length; i++) {
            if (self.loanTermList[i] == loanTerm) {
                // Overwrite current term with the last term
                self.loanTermList[i] = self.loanTermList[self
                    .loanTermList
                    .length -
                    1];

                // Shrink array size
                delete self.loanTermList[self.loanTermList.length - 1];
                self.loanTermList.length--;
            }
        }
    }

    function getLoanRecordById(
        State storage self,
        _Configuration.State storage configuration,
        bytes32 loanId
    )
        external
        view
        returns (
            address loanTokenAddress,
            address collateralTokenAddress,
            uint256 loanTerm,
            uint256 collateralAmount,
            uint256 createdAt,
            uint256 remainingDebt,
            uint256 currentCollateralRatio,
            bool isLiquidatable,
            bool isOverDue,
            bool isClosed
        )
    {
        (
            loanTokenAddress,
            collateralTokenAddress,
            loanTerm,
            collateralAmount,
            createdAt
        ) = _getLoanBasicInfoById(self, loanId);

        _PriceOracle priceOracle = _PriceOracle(
            configuration.priceOracleAddress
        );

        (
            remainingDebt,
            currentCollateralRatio,
            isLiquidatable,
            isOverDue,
            isClosed
        ) = _getLoanExtraInfoById(
            self,
            loanId,
            priceOracle.getPrice(loanTokenAddress),
            priceOracle.getPrice(collateralTokenAddress)
        );

        return (
            loanTokenAddress,
            collateralTokenAddress,
            loanTerm,
            collateralAmount,
            createdAt,
            remainingDebt,
            currentCollateralRatio,
            isLiquidatable,
            isOverDue,
            isClosed
        );
    }

    function _getLoanBasicInfoById(State storage self, bytes32 loanId)
        internal
        view
        returns (
            address loanTokenAddress,
            address collateralTokenAddress,
            uint256 loanTerm,
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
            loanRecord.collateralAmount,
            loanRecord.createdAt
        );
    }

    function _getLoanExtraInfoById(
        State storage self,
        bytes32 loanId,
        uint256 loanTokenPrice,
        uint256 collateralTokenPrice
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
            uint256[] memory remainingDebtList,
            uint256[] memory createdAtList,
            bool[] memory isClosedList
        )
    {
        LoanRecordListView memory loanRecordListView;
        loanRecordListView.loanIdList = self.loanIdsByAccount[accountAddress];
        if (loanRecordListView.loanIdList.length != 0) {
            for (uint256 i = 0; i < loanRecordListView.loanIdList.length; i++) {
                LoanRecord memory loanRecord = self
                    .loanRecordById[loanRecordListView.loanIdList[i]];
                loanRecordListView.loanIdList[i] = loanRecord.loanId;
                loanRecordListView.loanTokenAddressList[i] = loanRecord
                    .loanTokenAddress;
                loanRecordListView.collateralTokenAddressList[i] = loanRecord
                    .collateralTokenAddress;
                loanRecordListView.loanTermList[i] = loanRecord.loanTerm;
                loanRecordListView.remainingDebtList[i] = loanRecord
                    .loanAmount
                    .add(loanRecord.interest)
                    .sub(loanRecord.alreadyPaidAmount)
                    .sub(loanRecord.liquidatedAmount);
                loanRecordListView.createdAtList[i] = loanRecord.createdAt;
                loanRecordListView.isClosedList[i] = loanRecord.isClosed;
            }
        }
        return (
            loanRecordListView.loanIdList,
            loanRecordListView.loanTokenAddressList,
            loanRecordListView.collateralTokenAddressList,
            loanRecordListView.loanTermList,
            loanRecordListView.remainingDebtList,
            loanRecordListView.createdAtList,
            loanRecordListView.isClosedList
        );
    }

    function addCollateral(
        State storage self,
        bytes32 loanId,
        uint256 collateralAmount,
        bool useFreedCollateral
    ) external returns (uint256 totalCollateralAmount) {
        uint256 remainingCollateralAmount = collateralAmount;
        address collateralTokenAddress = self.loanRecordById[loanId]
            .collateralTokenAddress;

        if (useFreedCollateral) {
            uint256 availableFreedCollateral = subtractFreedCollateral(
                self,
                msg.sender,
                collateralTokenAddress,
                collateralAmount
            );
            remainingCollateralAmount -= availableFreedCollateral;
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

    function getFreedCollateralsByAccount(
        State storage self,
        address accountAddress
    )
        external
        view
        returns (
            address[] memory tokenAddressList,
            uint256[] memory freedCollateralAmountList
        )
    {
        for (uint256 i = 0; i < self.collateralTokenList.length; i++) {
            freedCollateralAmountList[i] = self
                .freedCollateralsByAccount[accountAddress][self
                .collateralTokenList[i]];
        }
        return (self.collateralTokenList, freedCollateralAmountList);
    }

    function withdrawFreedCollateral(
        State storage self,
        address accountAddress,
        address tokenAddress,
        uint256 collateralAmount
    ) external {
        uint256 availableFreedCollateral = self
            .freedCollateralsByAccount[accountAddress][tokenAddress];
        require(
            availableFreedCollateral >= collateralAmount,
            'AccountManager: Availiable freed collateral amount is not enough'
        );

        self.freedCollateralsByAccount[accountAddress][tokenAddress] = self
            .freedCollateralsByAccount[accountAddress][tokenAddress]
            .sub(availableFreedCollateral);

        // Transfer token from protocol to user.
        ERC20(tokenAddress).safeTransfer(
            accountAddress,
            availableFreedCollateral
        );

        emit WithdrawFreedCollateralSucceed(
            accountAddress,
            availableFreedCollateral
        );
    }

    function addFreedCollateral(
        State storage self,
        address accountAddress,
        address tokenAddress,
        uint256 amount
    ) public {
        self.freedCollateralsByAccount[accountAddress][tokenAddress] = self
            .freedCollateralsByAccount[accountAddress][tokenAddress]
            .add(amount);
    }

    function subtractFreedCollateral(
        State storage self,
        address accountAddress,
        address tokenAddress,
        uint256 amount
    ) public returns (uint256) {
        require(
            amount > 0,
            'LoanManager: The decrease in freed collateral amount must be greater than 0.'
        );

        uint256 availableFreedCollateral = Math.min(
            self.freedCollateralsByAccount[accountAddress][tokenAddress],
            amount
        );

        self.freedCollateralsByAccount[accountAddress][tokenAddress] = self
            .freedCollateralsByAccount[accountAddress][tokenAddress]
            .sub(availableFreedCollateral);

        return availableFreedCollateral;
    }

    function loan(
        State storage self,
        _Configuration.State storage configuration,
        _LiquidityPools.State storage liquidityPools,
        _DepositManager.State storage depositManager,
        address loanTokenAddress,
        address collateralTokenAddress,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 loanTerm,
        bool useFreedCollateral
    ) external returns (bytes32 loanId) {
        require(
            self
                .isLoanTokenPairEnabled[loanTokenAddress][collateralTokenAddress],
            'LoanManager: invalid loan and collateral token pair'
        );

        require(loanAmount > 0, 'LoanManager: invalid loan amount');
        require(collateralAmount > 0, 'LoanManager: invalid collateral amount');
        require(
            self.isLoanTermValid[loanTerm],
            'LoanManager: invalid loan term'
        );

        LocalVars memory localVars;
        localVars.remainingCollateralAmount = collateralAmount;

        if (useFreedCollateral) {
            // TODO(desmond): getFreedCollateral
            uint256 availableFreedCollateral = 0;

            localVars.remainingCollateralAmount = localVars
                .remainingCollateralAmount
                .sub(availableFreedCollateral);
        }

        // TODO(desmond): getLoanInterestRate
        localVars.loanInterestRate = 0;

        // TODO(desmond): getLiquidationDiscount
        localVars.liquidationDiscount = 0;

        // TODO(desmond): getMinCollateralCoverageRatio
        localVars.minCollateralCoverageRatio = 0;
        localVars.loanInterest = loanAmount
            .mulFixed(localVars.loanInterestRate)
            .mul(loanTerm)
            .div(365);

        _PriceOracle priceOracle = _PriceOracle(
            configuration.priceOracleAddress
        );
        localVars.loanTokenPrice = priceOracle.getPrice(loanTokenAddress);
        localVars.collateralTokenPrice = priceOracle.getPrice(
            collateralTokenAddress
        );

        localVars.currCollateralCoverageRatio = collateralAmount
            .mulFixed(localVars.collateralTokenPrice)
            .divFixed(loanAmount.add(localVars.loanInterest))
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
            loanTokenAddress: loanTokenAddress,
            collateralTokenAddress: collateralTokenAddress,
            loanAmount: loanAmount,
            collateralAmount: collateralAmount,
            loanTerm: loanTerm,
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
            isClosed: false
        });

        liquidityPools.loanFromPoolGroups(
            self,
            localVars.loanId,
            depositManager.enabledDepositTermList
        );

        // Transfer collateral tokens from loaner to protocol
        ERC20(collateralTokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            localVars.remainingCollateralAmount
        );

        // Transfer loan tokens from protocol to loaner
        ERC20(loanTokenAddress).safeTransfer(msg.sender, loanAmount);

        // TODO(desmond): increment stats

        emit LoanSucceed(msg.sender, localVars.loanId);

        return localVars.loanId;
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
        _LiquidityPools.State storage liquidityPools,
        _DepositManager.State storage depositManager,
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

        if (_calculateRemainingDebt(loanRecord) == 0) {
            loanRecord.isClosed = true;
            uint256 freedCollateralAmount = loanRecord.collateralAmount.sub(
                loanRecord.soldCollateralAmount
            );

            if (freedCollateralAmount > 0) {
                // Add freed collateral to loaner's account
                addFreedCollateral(
                    self,
                    msg.sender,
                    loanRecord.collateralTokenAddress,
                    freedCollateralAmount
                );
            }
        }

        for (
            uint256 i = 0;
            i < depositManager.enabledDepositTermList.length;
            i++
        ) {
            uint256 depositTerm = depositManager.enabledDepositTermList[i];

            if (loanRecord.loanTerm <= depositTerm) {
                liquidityPools.repayLoanToPoolGroup(
                    self,
                    loanId,
                    repayAmount,
                    depositTerm
                );
            }
        }

        // Transfer loan tokens from user to protocol
        ERC20(loanRecord.loanTokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            repayAmount
        );

        emit RepayLoanSucceed(msg.sender, loanId);

        return _calculateRemainingDebt(loanRecord);
    }

    function liquidateLoan(
        State storage self,
        _Configuration.State storage configuration,
        _LiquidityPools.State storage liquidityPools,
        _DepositManager.State storage depositManager,
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

        _PriceOracle priceOracle = _PriceOracle(
            configuration.priceOracleAddress
        );

        LocalVars memory localVars;
        localVars.loanTokenPrice = priceOracle.getPrice(
            loanRecord.loanTokenAddress
        );
        localVars.collateralTokenPrice = priceOracle.getPrice(
            loanRecord.collateralTokenAddress
        );

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

            uint256 freedCollateralAmount = loanRecord.collateralAmount.sub(
                loanRecord.soldCollateralAmount
            );

            if (freedCollateralAmount > 0) {
                // Add freed collateral to loaner's account
                addFreedCollateral(
                    self,
                    loanRecord.ownerAddress,
                    loanRecord.collateralTokenAddress,
                    freedCollateralAmount
                );
            }
        }

        for (
            uint256 i = 0;
            i < depositManager.enabledDepositTermList.length;
            i++
        ) {
            uint256 depositTerm = depositManager.enabledDepositTermList[i];

            if (loanRecord.loanTerm <= depositTerm) {
                liquidityPools.repayLoanToPoolGroup(
                    self,
                    loanId,
                    localVars.liquidatedAmount,
                    depositTerm
                );
            }
        }

        // TODO(desmond): increment stat if loan is overdue

        // Transfer loan tokens from liquidator to protocol
        ERC20(loanRecord.loanTokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            localVars.liquidatedAmount
        );

        emit LiquidateLoanSucceed(msg.sender, loanId);

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

    function setLoanInterestRatesForToken(
        State storage self,
        address tokenAddress,
        uint256[] calldata loanTerms,
        uint256[] calldata loanInterestRateList
    ) external {
        require(
            loanTerms.length == loanInterestRateList.length,
            "LoanManager: Arrays' length must be the same."
        );
        for (uint256 i = 0; i < loanInterestRateList.length; i++) {
            require(
                loanInterestRateList[i] < ONE,
                'LoanManager: interest rate must be smaller than 1.'
            );
        }

        for (uint256 i = 0; i < loanTerms.length; i++) {
            self
                .loanInterestRates[tokenAddress][loanTerms[i]] = loanInterestRateList[i];
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

    function getLoanInterestRateByToken(
        State storage self,
        address tokenAddress
    )
        external
        view
        returns (uint256[] memory loanTerms, uint256[] memory loanInterestRates)
    {
        loanTerms = self.loanTermList;
        loanInterestRates = new uint256[](loanTerms.length);

        for (uint256 i = 0; i < loanTerms.length; i++) {
            loanInterestRates[i] = self
                .loanInterestRates[tokenAddress][loanTerms[i]];
        }
        return (loanTerms, loanInterestRates);
    }
}
