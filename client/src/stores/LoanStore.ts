import { Dayjs } from 'dayjs';
import { ITerm, IAction, RecordType, IState } from '.';
import { replaceBy } from '../utils/replaceBy';
import { useSelector } from 'react-redux';

export enum LoanActionType {
  ReplaceLoanRecords = 'REPLACE_LOAN_RECORDS',
  UpdateLoanRecord = 'UPDATE_LOAN_RECORD',
  SetLoanInterestRate = 'SET_LOAN_INTEREST_RATE',
}

export interface ILoanRecord {
  recordId: string;
  loanTokenAddress: string;
  collateralTokenAddress: string;
  loanAmount: string;
  loanTerm: ITerm;
  collateralAmount: string;
  currentCollateralRatio?: string;
  interest?: string;
  remainingDebt?: string;
  createdAt: string;
  isOverDue?: boolean;
  isClosed?: boolean;
  isLiquidatable?: boolean;
  recordType: RecordType;
}

interface ILoanState {
  loanRecords: ILoanRecord[];
  loanInterestRates: IInterestRate[];
}

export interface IInterestRate {
  term: number;
  interestRate: string;
}

const initState: ILoanState = {
  loanRecords: [],
  loanInterestRates: [],
};

export const LoanReducer = (
  state: ILoanState = initState,
  action: IAction<LoanActionType>,
) => {
  switch (action.type) {
    case LoanActionType.ReplaceLoanRecords:
      return { ...state, loanRecords: action.payload.loanRecords };
    case LoanActionType.UpdateLoanRecord:
      if (
        state.loanRecords.find(
          record => action.payload.recordId === record.recordId,
        )
      ) {
        return {
          ...state,
          loanRecords: state.loanRecords.map(record =>
            record.recordId === action.payload.recordId
              ? replaceBy(record, action.payload.loanRecord)
              : record,
          ),
        };
      } else {
        return {
          ...state,
          loanRecords: [...state.loanRecords, action.payload.loanRecord],
        };
      }
    case LoanActionType.SetLoanInterestRate:
      return {
        ...state,
        loanInterestRates: action.payload.interestRates,
      };
    default:
      return state;
  }
};

export class LoanActions {
  static replaceLoanRecords(loanRecords: ILoanRecord[]) {
    return {
      type: LoanActionType.ReplaceLoanRecords,
      payload: {
        loanRecords,
      },
    };
  }
  static UpdateLoanRecord(recordId: string, loanRecord: ILoanRecord) {
    return {
      type: LoanActionType.UpdateLoanRecord,
      payload: {
        recordId,
        loanRecord,
      },
    };
  }
  static SetLoanInterestRate(interestRates: IInterestRate[]) {
    return {
      type: LoanActionType.SetLoanInterestRate,
      payload: {
        interestRates,
      },
    };
  }
}

export const useLoanInterestRates = () =>
  useSelector<IState, IInterestRate[]>(state => state.loan.loanInterestRates);

export const useLoanRecords = () =>
  useSelector<IState, ILoanRecord[]>(state => state.loan.loanRecords);
