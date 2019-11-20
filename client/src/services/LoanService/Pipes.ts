import { BigNumber } from '../../utils/BigNumber';
import { RecordType, ILoanRecord } from '../../stores';
import { isAllEqual } from '../../utils/isAllEqual';
import { formatSolidityTime } from '../../utils/formatSolidityTime';
import dayjs from 'dayjs';
import { getTermObjectByValue } from '../../utils/getTermObjectByValue';

interface IGetLoanRecordsResultSet {
  loanIdList: string[];
  loanTokenAddressList: string[];
  collateralTokenAddressList: string[];
  loanTermList: BigNumber[];
  loanAmountList: BigNumber[];
  collateralAmountList: BigNumber[];
  createdAtList: BigNumber[];
}

interface IGetLoanRecordResult {
  loanTokenAddress: string;
  collateralTokenAddress: string;
  loanTerm: BigNumber;
  loanAmount: BigNumber;
  collateralAmount: BigNumber;
  createdAt: BigNumber;
}

interface IGetLoanDetailsResult {
  remainingDebt: BigNumber;
  currentCollateralRatio: BigNumber;
  isLiquidatable: boolean;
  isOverDue: boolean;
  isClosed: boolean;
}

export const loanRecordsPipe = ({
  loanIdList,
  loanTokenAddressList,
  collateralTokenAddressList,
  loanTermList,
  loanAmountList,
  collateralAmountList,
  createdAtList,
}: IGetLoanRecordsResultSet): ILoanRecord[] => {
  if (
    isAllEqual(
      loanIdList.length,
      loanTokenAddressList.length,
      collateralTokenAddressList.length,
      loanTermList.length,
      loanAmountList.length,
      collateralAmountList.length,
      createdAtList.length,
    )
  ) {
    throw new Error('Client: Data length dose not match.');
  }

  return loanIdList.map((loanId: string, index: number) => ({
    recordId: loanId,
    loanTokenAddress: loanTokenAddressList[index],
    collateralTokenAddress: collateralTokenAddressList[index],
    loanTerm: getTermObjectByValue(loanTermList[index].toString()),
    loanAmount: loanAmountList[index],
    collateralAmount: collateralAmountList[index],
    createdAt: dayjs(formatSolidityTime(createdAtList[index])),
    recordType: RecordType.Loan,
  }));
};

export const loanRecordPipe = (
  recordId: string,
  {
    loanTokenAddress,
    collateralTokenAddress,
    loanTerm,
    loanAmount,
    collateralAmount,
    createdAt,
  }: IGetLoanRecordResult,
  {
    remainingDebt,
    currentCollateralRatio,
    isLiquidatable,
    isOverDue,
    isClosed,
  }: IGetLoanDetailsResult,
): ILoanRecord => {
  return {
    recordId,
    loanTokenAddress,
    collateralTokenAddress,
    loanTerm: getTermObjectByValue(loanTerm.toString()),
    remainingDebt,
    createdAt: dayjs(formatSolidityTime(createdAt)),
    loanAmount,
    collateralAmount,
    interest: remainingDebt.sub(loanAmount),
    currentCollateralRatio,
    isLiquidatable,
    isOverDue,
    isClosed,
    recordType: RecordType.Loan,
  };
};
