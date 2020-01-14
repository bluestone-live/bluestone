import { Dayjs } from 'dayjs';
import { ITerm, IAction, RecordType, IState } from '.';
import { replaceBy } from '../utils/replaceBy';
import { useSelector } from 'react-redux';

export enum DepositActionType {
  ReplaceDepositRecords = 'REPLACE_DEPOSIT_RECORDS',
  UpdateDepositRecord = 'UPDATE_DEPOSIT_RECORD',
}

export interface IDepositRecord {
  recordId: string;
  tokenAddress: string;
  depositTerm: ITerm;
  depositAmount: string;
  poolId?: string;
  createdAt: Dayjs;
  maturedPoolID: string;
  withdrewPoolID?: string;
  isMatured?: boolean;
  isWithdrawn?: boolean;
  interest?: string;
  recordType: RecordType;
  isEarlyWithdrawable?: boolean;
}

interface IDepositState {
  depositRecords: IDepositRecord[];
}

const initState: IDepositState = {
  depositRecords: [],
};

export const DepositReducer = (
  state: IDepositState = initState,
  action: IAction<DepositActionType>,
) => {
  switch (action.type) {
    case DepositActionType.ReplaceDepositRecords:
      return { ...state, depositRecords: action.payload.depositRecords };
    case DepositActionType.UpdateDepositRecord:
      if (
        state.depositRecords.find(
          record => record.recordId === action.payload.depositRecord.recordId,
        )
      ) {
        return {
          ...state,
          depositRecords: state.depositRecords.map(record =>
            record.recordId === action.payload.depositRecord.recordId
              ? replaceBy(record, action.payload.depositRecord)
              : record,
          ),
        };
      } else {
        return {
          ...state,
          depositRecords: [
            ...state.depositRecords,
            action.payload.depositRecord,
          ],
        };
      }
    default:
      return state;
  }
};

export class DepositActions {
  static replaceDepositRecords(depositRecords: IDepositRecord[]) {
    return {
      type: DepositActionType.ReplaceDepositRecords,
      payload: {
        depositRecords,
      },
    };
  }
  static UpdateDepositRecord(depositRecord: IDepositRecord) {
    return {
      type: DepositActionType.UpdateDepositRecord,
      payload: {
        depositRecord,
      },
    };
  }
}

export const useDeposit = () =>
  useSelector<IState, IDepositRecord[]>(state =>
    state.deposit.depositRecords.sort(
      (record1: IDepositRecord, record2: IDepositRecord) =>
        record2.createdAt.valueOf() - record1.createdAt.valueOf(),
    ),
  );
