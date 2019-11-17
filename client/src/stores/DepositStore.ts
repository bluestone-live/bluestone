import { Dayjs } from 'dayjs';
import { BigNumber } from '../utils/BigNumber';
import { ITerm, IAction, RecordType } from '.';
import { replaceBy } from '../utils/replaceBy';

export enum DepositActionType {
  ReplaceDepositRecords = 'REPLACE_DEPOSIT_RECORDS',
  UpdateDepositRecord = 'UPDATE_DEPOSIT_RECORD',
}

export interface IDepositRecord {
  recordId: string;
  tokenAddress: string;
  depositTerm: ITerm;
  depositAmount: BigNumber;
  poolId?: BigNumber;
  createdAt: Dayjs;
  maturedAt: Dayjs;
  withdrewAt: Dayjs;
  isMatured?: boolean;
  isWithdrawn?: boolean;
  interest?: BigNumber;
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
