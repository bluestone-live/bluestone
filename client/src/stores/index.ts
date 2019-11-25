import { combineReducers, createStore } from 'redux';
import { AccountReducer } from './AccountStore';
import { CommonReducer } from './CommonStore';
import { DepositReducer, IDepositRecord } from './DepositStore';
import { LoanReducer, ILoanRecord } from './LoanStore';
import { TransactionReducer } from './TransactionStore';
import { PoolReducer } from './PoolStore';

export interface IAction<T> {
  type: T;
  payload: any;
}

export enum RecordType {
  Deposit = 'deposit',
  Loan = 'loan',
}

const reducers = combineReducers({
  account: AccountReducer,
  common: CommonReducer,
  deposit: DepositReducer,
  loan: LoanReducer,
  transaction: TransactionReducer,
  pool: PoolReducer,
});

export const store = createStore(reducers);

export type IState = ReturnType<typeof reducers>;

export type IRecord = IDepositRecord | ILoanRecord;

export * from './AccountStore';
export * from './CommonStore';
export * from './DepositStore';
export * from './LoanStore';
export * from './TransactionStore';
export * from './PoolStore';
