import { IDepositRecord, RecordType, ITerm } from '../../stores';
import { getTermObjectByValue } from '../../utils/getTermObjectByValue';
import { formatSolidityTime } from '../../utils/formatSolidityTime';
import dayjs from 'dayjs';
import { getCurrentPoolId } from '../../utils/poolIdCalculator';

interface IGetDepositRecordResponse {
  depositId: string;
  tokenAddress: string;
  depositTerm: ITerm;
  depositAmount: string;
  poolId: string;
  interest: string;
  createdAt: string;
  withdrewAt: string;
  weight: string;
}

export const depositRecordsPipe = (
  resultSet: IGetDepositRecordResponse[],
): IDepositRecord[] => {
  const currentPoolId = getCurrentPoolId();

  return resultSet.map((depositRecord: IGetDepositRecordResponse) => ({
    recordId: depositRecord.depositId,
    tokenAddress: depositRecord.tokenAddress,
    depositTerm: getTermObjectByValue(depositRecord.depositTerm.toString()),
    depositAmount: depositRecord.depositAmount,
    poolId: depositRecord.poolId,
    createdAt: dayjs.utc(formatSolidityTime(depositRecord.createdAt)),
    withdrewAt: dayjs.utc(formatSolidityTime(depositRecord.withdrewAt)),
    isMatured: currentPoolId > Number.parseInt(depositRecord.poolId, 10),
    isWithdrawn: Number.parseInt(depositRecord.withdrewAt, 10) > 0,
    interest: depositRecord.interest,
    recordType: RecordType.Deposit,
  }));
};

export const depositRecordPipe = (
  depositRecord: IGetDepositRecordResponse,
  isEarlyWithdrawable: boolean,
): IDepositRecord => {
  const currentPoolId = getCurrentPoolId();

  return {
    recordId: depositRecord.depositId,
    tokenAddress: depositRecord.tokenAddress,
    depositTerm: getTermObjectByValue(depositRecord.depositTerm.toString()),
    depositAmount: depositRecord.depositAmount,
    poolId: depositRecord.poolId,
    createdAt: dayjs.utc(formatSolidityTime(depositRecord.createdAt)),
    withdrewAt: dayjs.utc(formatSolidityTime(depositRecord.withdrewAt)),
    isMatured: currentPoolId > Number.parseInt(depositRecord.poolId, 10),
    isWithdrawn: Number.parseInt(depositRecord.withdrewAt, 10) > 0,
    interest: depositRecord.interest,
    recordType: RecordType.Deposit,
    isEarlyWithdrawable,
  };
};
