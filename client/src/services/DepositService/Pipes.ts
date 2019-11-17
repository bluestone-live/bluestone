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
