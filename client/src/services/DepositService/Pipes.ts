import { IDepositRecord, RecordType } from '../../stores';
import { getTermObjectByValue } from '../../utils/getTermObjectByValue';
import { formatSolidityTime } from '../../utils/formatSolidityTime';
import dayjs from 'dayjs';

interface IGetDepositRecordResponse {
  depositId: string;
  tokenAddress: string;
  depositTerm: string;
  depositAmount: string;
  poolId: string;
  createdAt: string;
  maturedAt: string;
  withdrewAt: string;
}

export const depositRecordsPipe = (
  resultSet: IGetDepositRecordResponse[],
): IDepositRecord[] => {
  return resultSet.map((depositRecord: IGetDepositRecordResponse) => ({
    ...depositRecord,
    recordId: depositRecord.depositId,
    depositTerm: getTermObjectByValue(depositRecord.depositTerm.toString()),
    createdAt: dayjs(formatSolidityTime(depositRecord.createdAt)),
    maturedPoolID: depositRecord.maturedAt,
    withdrewPoolID: depositRecord.withdrewAt,
    recordType: RecordType.Deposit,
  }));
};

export const depositRecordPipe = (
  depositId: string,
  record: IGetDepositRecordResponse,
  interest: string,
  isEarlyWithdrawable: boolean,
): IDepositRecord => {
  return {
    recordId: depositId,
    ...record,
    depositTerm: getTermObjectByValue(record.depositTerm.toString()),
    createdAt: dayjs(formatSolidityTime(record.createdAt)),
    maturedPoolID: record.maturedAt,
    withdrewPoolID: record.withdrewAt,
    recordType: RecordType.Deposit,
    interest,
    isEarlyWithdrawable,
  };
};
