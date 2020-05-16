import { ITerm, IAction, RecordType, IState } from '.';
import { replaceBy } from '../utils/replaceBy';
import { useSelector } from 'react-redux';
import { Dayjs } from 'dayjs';

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
  collateralAmount: string;
  loanTerm: ITerm;
  annualInterestRate: string;
  interest: string;
  collateralCoverageRatio: string;
  minCollateralCoverageRatio: string;
  alreadyPaidAmount: string;
  soldCollateralAmount: string;
  liquidatedAmount: string;
  remainingDebt: string;
  createdAt: Dayjs;
  dueAt: Dayjs;
  isOverDue: boolean;
  isClosed: boolean;
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
          record => action.payload.loanRecord.recordId === record.recordId,
        )
      ) {
        return {
          ...state,
          loanRecords: state.loanRecords.map(record =>
            record.recordId === action.payload.loanRecord.recordId
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
  static UpdateLoanRecord(loanRecord: ILoanRecord) {
    return {
      type: LoanActionType.UpdateLoanRecord,
      payload: {
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
