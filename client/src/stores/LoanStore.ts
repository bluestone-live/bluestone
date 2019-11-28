import { Dayjs } from 'dayjs';
import { BigNumber } from '../utils/BigNumber';
import { ITerm, IAction, RecordType, IState } from '.';
import { replaceBy } from '../utils/replaceBy';
import { uniqueBy } from '../utils/uniqueBy';
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
  loanAmount: BigNumber;
  loanTerm: ITerm;
  collateralAmount: BigNumber;
  currentCollateralRatio?: BigNumber;
  interest?: BigNumber;
  remainingDebt?: BigNumber;
  createdAt: Dayjs;
  isOverDue?: boolean;
  isClosed?: boolean;
  isLiquidatable?: boolean;
  recordType: RecordType;
}

interface ILoanState {
  loanRecords: ILoanRecord[];
  loanInterestRates: IInterestRate[];
}

interface IInterestRate {
  term: string;
  interestRate?: BigNumber;
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
        loanInterestRates: uniqueBy(
          [...state.loanInterestRates, action.payload.loanInterestRate],
          'term',
        ),
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
  static SetLoanInterestRate(term: number, interestRate: BigNumber) {
    return {
      type: LoanActionType.SetLoanInterestRate,
      payload: {
        loanInterestRate: {
          term: term.toString(),
          interestRate,
        },
      },
    };
  }
}

export const useLoanInterestRate = (term: number) =>
  useSelector<IState, IInterestRate>(
    state =>
      state.loan.loanInterestRates.find(
        loanInterestRate => loanInterestRate.term === term.toString(),
      ) || { term: term.toString(), interestRate: null },
  );
