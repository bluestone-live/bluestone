import dayjs from 'dayjs';
import { ITerm } from './Term';
import { IToken } from './Token';

export enum TransactionType {
  Deposit,
  Loan,
}

// deposit
export interface IGetDepositTransactionResponse {
  transactionId: string; // TODO need to store this in contract
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
  isOverDue: boolean;
}

export interface IDepositTransaction {
  transactionId: string; // TODO need to store this in contract
  owner: string; // address
  type: TransactionType;
  status: TransactionStatus;
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

export enum TransactionStatus {
  Lock = 0,
  DepositNormal = 10,
  DepositAutoRenewal = 11,
  DepositMatured = 12,
  DepositOverDue = 13,
  LoanNormal = 20,
  LoanPartialRepaid = 21,
  LoanLiquidating = 22,
  LoanClosed = 23,
}

export const getDepositTransactionStatus = (
  transaction: IGetDepositTransactionResponse,
) => {
  // TODO: find out when will get lock status
  const now = dayjs().valueOf();
  if (transaction.isOverDue) {
    return TransactionStatus.DepositOverDue;
  } else if (now >= transaction.maturedAt) {
    return TransactionStatus.DepositMatured;
  } else if (transaction.isRecurring) {
    return TransactionStatus.DepositAutoRenewal;
  }
  return TransactionStatus.DepositNormal;
};

export const getLoanTransactionStatus = (
  transaction: IGetLoanTransactionResponse,
) => {
  // TODO: find out when will get lock status
  const now = dayjs().valueOf();
  if (transaction.isClosed) {
    return TransactionStatus.LoanClosed;
  }
  if (
    dayjs(transaction.createdAt)
      .add(transaction.term, 'day')
      .valueOf() >= now
  ) {
    return TransactionStatus.LoanLiquidating;
  }
  if (transaction.isClosed) {
    return TransactionStatus.LoanClosed;
  }
  if (transaction.liquidatedAmount) {
    return TransactionStatus.LoanLiquidating;
  }
  if (
    transaction.alreadyPaidAmount &&
    transaction.alreadyPaidAmount !== 0 &&
    transaction.alreadyPaidAmount < transaction.loanAmount
  ) {
    return TransactionStatus.LoanPartialRepaid;
  }
  return TransactionStatus.LoanNormal;
};

export interface ILoanTransaction {
  transactionId: string; // TODO need to store this in contract
  owner: string; // address
  type: TransactionType;
  status: TransactionStatus;
  collateralToken: IToken;
  loanToken: IToken;
  term: ITerm;
  loanAmount: number;
  withdrewAmount?: number;
  alreadyPaidAmount?: number;
  collateralAmount: number;
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
  transactionId: string; // TODO need to store this in contract
  owner: string; // address
  term: number;
  loanToken?: string;
  collateralToken?: string;
  loanAmount: number;
  withdrewAmount?: number;
  alreadyPaidAmount?: number;
  collateralAmount: number;
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
