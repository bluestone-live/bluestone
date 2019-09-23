pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/math/Math.sol';
import '../../lib/FixedMath.sol';

// TODO(desmond): remove `_` after contract refactor is complete.
library _LoanManager {
    using SafeMath for uint256;
    using FixedMath for uint256;

    struct State {
        uint256[] loanTermList;
        mapping(uint256 => bool) isLoanTermValid;
        // loanId -> LoanRecord
        mapping(bytes32 => LoanRecord) loanRecordsById;
        // accountAddress -> loanIds
        mapping(address => bytes32[]) loanIdsByAccountAddress;
        // TODO(ZhangRGK): I need a collateral token list in account manager, I will merge it after loan pair finished
        address[] collateralTokenList;
        // account -> tokenAddress -> freedCollateralamount
        mapping(address => mapping(address => uint256)) freedCollateralsByAccount;
    }

    event WithdrawFreedCollateralSucceed(
        address indexed accountAddress,
        uint256 amount
    );

    uint256 private constant DAY_IN_SECONDS = 86400;

    struct LoanRecord {
        bytes32 loanId;
        address loanTokenAddress;
        address collateralTokenAddress;
        address owner;
        uint256 loanTerm;
        uint256 loanAmount;
        uint256 collateralAmount;
        uint256 annualInterestRate;
        uint256 interest;
        uint256 minCollateralRatio;
        uint256 liquidationDiscount;
        uint256 alreadyPaidAmount;
        uint256 liquidatedAmount;
        uint256 soldCollateralAmount;
        uint256 createdAt;
        uint256 lastInterestUpdatedAt;
        uint256 lastRepaidAt;
        uint256 lastLiquidatedAt;
        bool isClosed;
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

    function addLoanTerm(State storage self, uint256 loanTerm) external {
        require(
            !self.isLoanTermValid[loanTerm],
            'LoanManager: term already exists'
        );

        self.loanTermList.push(loanTerm);
        self.isLoanTermValid[loanTerm] = true;

        // TODO(desmond): update totalLoanableAmountPerTerm for each deposit asset and deposit term

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

    function getLoanBasicInfoById(State storage self, bytes32 loanId)
        external
        view
        returns (
            address loanTokenAddress,
            address collateralTokenAddress,
            uint256 loanTerm,
            uint256 collateralAmount,
            uint256 createdAt
        )
    {
        LoanRecord memory loanRecord = self.loanRecordsById[loanId];

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

    function getLoanExtraInfoById(
        State storage self,
        bytes32 loanId,
        uint256 collateralTokenPrice,
        uint256 loanTokenPrice
    )
        external
        view
        returns (
            uint256 remainingDebt,
            uint256 currentCollateralRatio,
            bool isLiquidatable,
            bool isOverDue,
            bool isClosed
        )
    {
        LoanRecord memory loanRecord = self.loanRecordsById[loanId];
        require(
            loanRecord.loanTokenAddress != address(0),
            'LoanManager: Loan ID is invalid'
        );

        remainingDebt = loanRecord
            .loanAmount
            .add(loanRecord.interest)
            .sub(loanRecord.alreadyPaidAmount)
            .sub(loanRecord.liquidatedAmount);

        currentCollateralRatio = loanRecord
            .collateralAmount
            .sub(loanRecord.soldCollateralAmount)
            .mulFixed(collateralTokenPrice)
            .divFixed(remainingDebt)
            .divFixed(loanTokenPrice);

        isOverDue =
            now > loanRecord.createdAt + loanRecord.loanTerm * DAY_IN_SECONDS;

        isLiquidatable =
            (currentCollateralRatio < loanRecord.minCollateralRatio) ||
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
        loanRecordListView.loanIdList = self
            .loanIdsByAccountAddress[accountAddress];
        if (loanRecordListView.loanIdList.length != 0) {
            for (uint256 i = 0; i < loanRecordListView.loanIdList.length; i++) {
                LoanRecord memory loanRecord = self
                    .loanRecordsById[loanRecordListView.loanIdList[i]];
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
        uint256 collateralAmount
    ) external returns (uint256 totalCollateralAmount) {
        self.loanRecordsById[loanId].collateralAmount = self
            .loanRecordsById[loanId]
            .collateralAmount
            .add(collateralAmount);
        return self.loanRecordsById[loanId].collateralAmount;
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
        // TODO(ZhangRGK): send token from tokenManager to user account
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
    ) external {
        self.freedCollateralsByAccount[accountAddress][tokenAddress] = self
            .freedCollateralsByAccount[accountAddress][tokenAddress]
            .add(amount);
    }

    function subtractFreedCollateral(
        State storage self,
        address accountAddress,
        address tokenAddress,
        uint256 amount
    ) external returns (uint256) {
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
}
