import { ITerm } from './Term';
import { IToken } from './Token';

export enum TransactionType {
  Deposit,
  DepositMatured,
  Loan,
  LoanLiquidated,
  Closed,
  Unknown,
}

// TODO: sync required
export const getLoanTransactionType = (transaction: ILoanTransaction) => {
  if (transaction.isClosed) {
    return TransactionType.Closed;
  }
  if (transaction.liquidatedAmount) {
    return TransactionType.LoanLiquidated;
  }
  if (transaction.createdAt) {
    return TransactionType.Loan;
  }
  return TransactionType.Unknown;
};

export interface IGetDepositTransactionResponse {
  transactionId: number; // TODO need to store this in contract
  owner: string; // address
  token: string;
  term: number; // address
  depositAmount: number;
  interestRate: number;
  withdrewAmount?: number;
  createdAt: number;
  maturedAt: number;
  withdrewAt?: number; // can a deposit order withdrew multiple times
  isRecurring: boolean;
}

export interface IDepositTransaction {
  transactionId: number; // TODO need to store this in contract
  owner: string; // address
  type: TransactionType;
  token: IToken;
  term: ITerm; // address
  depositAmount: number;
  interestRate: number;
  withdrewAmount?: number;
  createdAt: number;
  maturedAt: number;
  withdrewAt?: number; // can a deposit order withdrew multiple times
  isRecurring: boolean;
}

export interface ILoanTransaction {
  transactionId: number; // TODO need to store this in contract
  owner: string; // address
  type: TransactionType;
  // token: IToken; // TODO why loan transaction didn't have token property?
  term: ITerm;
  loanAmount: number;
  withdrewAmount?: number;
  alreadyPaidAmount?: number;
  collateralAmount?: number;
  liquidatedAmount?: number;
  soldCollateralAmount?: number;
  minCollateralRatio: number;
  interestRate: number;
  liquidationDiscount?: number;
  createdAt: number;
  isClosed: boolean;
  accruedInterest: number;
  lastInterestUpdatedAt?: number;
  lastRepaidAt?: number;
  lastLiquidatedAt?: number;
}

export interface IGetLoanTransactionResponse {
  transactionId: number; // TODO need to store this in contract
  owner: string; // address
  // token: IToken; // TODO why loan transaction didn't have token property?
  term: number;
  loanAmount: number;
  withdrewAmount?: number;
  alreadyPaidAmount?: number;
  collateralAmount?: number;
  liquidatedAmount?: number;
  soldCollateralAmount?: number;
  minCollateralRatio: number;
  interestRate: number;
  liquidationDiscount?: number;
  createdAt: number;
  isClosed: boolean;
  accruedInterest: number;
  lastInterestUpdatedAt?: number;
  lastRepaidAt?: number;
  lastLiquidatedAt?: number;
}

export type ITransaction = IDepositTransaction | ILoanTransaction;
