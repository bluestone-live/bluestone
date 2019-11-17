import { BigNumber } from '../../utils/BigNumber';
import { IDepositRecord, RecordType } from '../../stores';
import { isAllEqual } from '../../utils/isAllEqual';
import { getTermObjectByValue } from '../../utils/getTermObjectByValue';
import { formatSolidityTime } from '../../utils/formatSolidityTime';
import dayjs from 'dayjs';

interface IGetDepositRecordsResultSet {
  depositIdList: string[];
  tokenAddressList: string[];
  depositTermList: BigNumber[];
  depositAmountList: BigNumber[];
  createdAtList: BigNumber[];
  maturedAtList: BigNumber[];
  withdrewAtList: BigNumber[];
}

interface IGetDepositRecordByIdResult {
  tokenAddress: string;
  depositTerm: BigNumber;
  depositAmount: BigNumber;
  poolId: BigNumber;
  createdAt: BigNumber;
  maturedAt: BigNumber;
  withdrewAt: BigNumber;
  isMatured: boolean;
  isWithdrawn: boolean;
}

export const depositRecordsPipe = ({
  depositIdList,
  tokenAddressList,
  depositTermList,
  depositAmountList,
  createdAtList,
  maturedAtList,
  withdrewAtList,
}: IGetDepositRecordsResultSet): IDepositRecord[] => {
  if (
    isAllEqual(
      depositIdList.length,
      tokenAddressList.length,
      depositTermList.length,
      depositAmountList.length,
      createdAtList.length,
      maturedAtList.length,
      withdrewAtList.length,
    )
  ) {
    throw new Error('Client: Data length dose not match.');
  }

  return depositIdList.map((depositId: string, index: number) => ({
    recordId: depositId,
    tokenAddress: tokenAddressList[index],
    depositTerm: getTermObjectByValue(depositTermList[index].toString()),
    depositAmount: depositAmountList[index],
    createdAt: dayjs(formatSolidityTime(createdAtList[index])),
    maturedAt: dayjs(formatSolidityTime(maturedAtList[index])),
    withdrewAt: dayjs(formatSolidityTime(withdrewAtList[index])),
    recordType: RecordType.Deposit,
  }));
};

export const depositRecordPipe = (
  depositId: string,
  record: IGetDepositRecordByIdResult,
  interest: BigNumber,
  isEarlyWithdrawable: boolean,
): IDepositRecord => {
  const {
    tokenAddress,
    depositTerm,
    depositAmount,
    poolId,
    createdAt,
    maturedAt,
    withdrewAt,
    isMatured,
    isWithdrawn,
  } = record;

  return {
    recordId: depositId,
    tokenAddress,
    depositTerm: getTermObjectByValue(depositTerm.toString()),
    depositAmount,
    poolId,
    createdAt: dayjs(formatSolidityTime(createdAt)),
    maturedAt: dayjs(formatSolidityTime(maturedAt)),
    withdrewAt: dayjs(formatSolidityTime(withdrewAt)),
    isMatured,
    isWithdrawn,
    interest,
    isEarlyWithdrawable,
    recordType: RecordType.Deposit,
  };
};
