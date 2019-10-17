import { combineReducers, createStore } from 'redux';
import { AccountReducer } from './AccountStore';
import { CommonReducer } from './CommonStore';
import { DepositReducer, IDepositRecord } from './DepositStore';
import { LoanReducer, ILoanRecord } from './LoanStore';
import { TransactionReducer } from './TransactionStore';

export interface IAction<T> {
  type: T;
  payload: any;
}

export enum RecordType {
  Deposit,
  Loan,
}

const reducers = combineReducers({
  account: AccountReducer,
  common: CommonReducer,
  deposit: DepositReducer,
  loan: LoanReducer,
  transaction: TransactionReducer,
});

export const store = createStore(reducers);

export type IState = ReturnType<typeof reducers>;

export type IRecord = IDepositRecord | ILoanRecord;

export * from './AccountStore';
export * from './CommonStore';
export * from './DepositStore';
export * from './LoanStore';
export * from './TransactionStore';
