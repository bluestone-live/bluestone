import moment from 'moment';
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
}

export interface IDepositTransaction {
  transactionId: string; // TODO need to store this in contract
  owner: string; // address
  type: TransactionType;
  status: DepositTransactionStatus;
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

export enum DepositTransactionStatus {
  Normal,
  AutoRenewal,
  Matured,
}

export const getDepositTransactionStatus = (
  transaction: IGetDepositTransactionResponse,
) => {
  const now = moment().valueOf();
  if (now >= transaction.maturedAt) {
    return DepositTransactionStatus.Matured;
  } else if (transaction.isRecurring) {
    return DepositTransactionStatus.AutoRenewal;
  }
  return DepositTransactionStatus.Normal;
};

export enum LoanTransactionStatus {
  Safety,
  Risky,
  PartialRepaid,
  Liquidated,
  Closed,
  Unknown,
}

export const getLoanTransactionStatus = (
  transaction: IGetLoanTransactionResponse,
) => {
  if (transaction.isClosed) {
    return LoanTransactionStatus.Closed;
  }
  if (transaction.liquidatedAmount) {
    return LoanTransactionStatus.Liquidated;
  }
  if (transaction.createdAt) {
    return LoanTransactionStatus.Safety;
  }
  if (transaction.isClosed) {
    return LoanTransactionStatus.Closed;
  }
  if (transaction.liquidatedAmount) {
    return LoanTransactionStatus.Liquidated;
  }
  if (
    transaction.alreadyPaidAmount &&
    transaction.alreadyPaidAmount !== 0 &&
    transaction.alreadyPaidAmount < transaction.loanAmount
  ) {
    return LoanTransactionStatus.PartialRepaid;
  }
  return LoanTransactionStatus.Unknown;
};

export interface ILoanTransaction {
  transactionId: string; // TODO need to store this in contract
  owner: string; // address
  type: TransactionType;
  status: LoanTransactionStatus;
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
