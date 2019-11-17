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
  remainingDebtList: BigNumber[];
  createdAtList: BigNumber[];
  isClosedList: boolean[];
}

export const loanRecordsPipe = ({
  loanIdList,
  loanTokenAddressList,
  collateralTokenAddressList,
  loanTermList,
  remainingDebtList,
  createdAtList,
  isClosedList,
}: IGetLoanRecordsResultSet): ILoanRecord[] => {
  if (
    isAllEqual(
      loanIdList.length,
      loanTokenAddressList.length,
      collateralTokenAddressList.length,
      loanTermList.length,
      remainingDebtList.length,
      createdAtList.length,
      isClosedList.length,
    )
  ) {
    throw new Error('Client: Data length dose not match.');
  }

  return loanIdList.map((loanId: string, index: number) => ({
    recordId: loanId,
    loanTokenAddress: loanTokenAddressList[index],
    collateralTokenAddress: collateralTokenAddressList[index],
    loanTerm: getTermObjectByValue(loanTermList[index].toString()),
    remainingDebt: remainingDebtList[index],
    createdAt: dayjs(formatSolidityTime(createdAtList[index])),
    isClosed: isClosedList[index],
    recordType: RecordType.Loan,
  }));
};
