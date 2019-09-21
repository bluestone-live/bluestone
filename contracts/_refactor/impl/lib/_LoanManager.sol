pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "../../lib/FixedMath.sol";

// TODO(desmond): remove `_` after contract refactor is complete.
library _LoanManager {
    using SafeMath for uint;
    using FixedMath for uint;

    struct State {
        uint[] loanTermList;
        mapping(uint => bool) isLoanTermValid;

        // loanId -> LoanRecord
        mapping(bytes32 => LoanRecord) loanRecordsById;

        // accountAddress -> loanIds
        mapping(address => bytes32[]) loanIdsByAccountAddress;
    }

    uint private constant DAY_IN_SECONDS = 86400;

    struct LoanRecord {
        bytes32 loanId;
        address loanTokenAddress;
        address collateralTokenAddress;
        address owner;
        uint loanTerm;
        uint loanAmount;
        uint collateralAmount;
        uint annualInterestRate;
        uint interest;
        uint minCollateralRatio;
        uint liquidationDiscount;
        uint alreadyPaidAmount;
        uint liquidatedAmount;
        uint soldCollateralAmount;
        uint createdAt;
        uint lastInterestUpdatedAt;
        uint lastRepaidAt;
        uint lastLiquidatedAt;
        bool isClosed;
    }

    struct LoanRecordListView {
        bytes32[] loanIdList;
        address[] loanTokenAddressList;
        address[] collateralTokenAddressList;
        uint[] loanTermList;
        uint[] remainingDebtList;
        uint[] createdAtList;
        uint[] currentCollateralRatioList;
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

    function getLoanBasicInfoById(
        State storage self,
        bytes32 loanId
    )
        external
        view
        returns (
            address loanTokenAddress,
            address collateralTokenAddress,
            uint loanTerm,
            uint collateralAmount,
            uint createdAt
        )
    {
        LoanRecord memory loanRecord = self.loanRecordsById[loanId];

        require(loanRecord.loanTokenAddress != address(0), "LoanManager: Loan ID is invalid");


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
        uint collateralTokenPrice,
        uint loanTokenPrice
    )
        external
        view
        returns (
            uint remainingDebt,
            uint currentCollateralRatio,
            bool isLiquidatable,
            bool isOverDue,
            bool isClosed
        )
    {
        LoanRecord memory loanRecord = self.loanRecordsById[loanId];
        require(loanRecord.loanTokenAddress != address(0), "LoanManager: Loan ID is invalid");

        remainingDebt = loanRecord.loanAmount
            .add(loanRecord.interest)
            .sub(loanRecord.alreadyPaidAmount)
            .sub(loanRecord.liquidatedAmount);

        currentCollateralRatio = loanRecord
            .collateralAmount.sub(loanRecord.soldCollateralAmount)
            .mulFixed(collateralTokenPrice)
            .divFixed(remainingDebt)
            .divFixed(loanTokenPrice);

        isOverDue = now > loanRecord.createdAt + loanRecord.loanTerm * DAY_IN_SECONDS;

        isLiquidatable = (currentCollateralRatio < loanRecord.minCollateralRatio) ||
            isOverDue;

        return (
            remainingDebt,
            currentCollateralRatio,
            isLiquidatable,
            isOverDue,
            loanRecord.isClosed
        );
    }

    function getLoanRecordsByAccount(
        State storage self,
        address accountAddress
    )
        external
        view
        returns (
            bytes32[] memory loanIdList,
            address[] memory loanTokenAddressList,
            address[] memory collateralTokenAddressList,
            uint[] memory loanTermList,
            uint[] memory remainingDebtList,
            uint[] memory createdAtList,
            bool[] memory isClosedList
        )
    {
        LoanRecordListView memory loanRecordListView;
        loanRecordListView.loanIdList = self.loanIdsByAccountAddress[accountAddress];
        if (loanRecordListView.loanIdList.length != 0) {
            for (uint i = 0; i < loanRecordListView.loanIdList.length; i++) {
                LoanRecord memory loanRecord = self.loanRecordsById[loanRecordListView.loanIdList[i]];
                loanRecordListView.loanIdList[i] = loanRecord.loanId;
                loanRecordListView.loanTokenAddressList[i] = loanRecord.loanTokenAddress;
                loanRecordListView.collateralTokenAddressList[i] = loanRecord.collateralTokenAddress;
                loanRecordListView.loanTermList[i] = loanRecord.loanTerm;
                loanRecordListView.remainingDebtList[i] = loanRecord.loanAmount
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
}
