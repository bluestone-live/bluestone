import dayjs from 'dayjs';
import { ITerm } from './Term';
import { IToken } from './Token';
import { Contract } from 'web3-eth-contract';

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
  transactionAddress: string; // TODO need to store this in contract
  owner: string; // address
  type: TransactionType;
  status: TransactionStatus;
  token: IToken;
  term: ITerm; // address
  depositAmount: number;
  withdrewAmount?: number;
  createdAt: number;
  maturedAt: number;
  withdrewAt?: number; // can a deposit order withdrew multiple times
  isRecurring: boolean;
  contract: Contract;
}

export enum TransactionStatus {
  Lock = 0,
  DepositNormal = 10,
  DepositRecurring = 11,
  DepositMatured = 12,
  DepositOverDue = 13,
  DepositClose = 14,
  LoanNormal = 20,
  LoanPartialRepaid = 21,
  LoanLiquidating = 22,
  LoanClosed = 23,
}

export const getDepositTransactionStatus = async (
  depositInstance: Contract,
) => {
  // TODO: find out when will get lock status
  const isOverDue = await depositInstance.methods.isOverDue().call();
  const isWithdrawn = await depositInstance.methods.isWithdrawn().call();
  const isMatured = await depositInstance.methods.isMatured().call();
  const isRecurring = await depositInstance.methods.isRecurring().call();
  if (isWithdrawn) {
    return TransactionStatus.DepositClose;
  } else if (isOverDue) {
    return TransactionStatus.DepositOverDue;
  } else if (isMatured) {
    return TransactionStatus.DepositMatured;
  } else if (isRecurring) {
    return TransactionStatus.DepositRecurring;
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
  transactionAddress: string; // TODO need to store this in contract
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
  transactionAddress: string; // TODO need to store this in contract
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
