import { ITerm } from './Term';
import { IToken } from './Token';
import { Contract } from 'web3-eth-contract';

export enum RecordType {
  Deposit,
  Loan,
}

export interface IDepositRecord {
  recordAddress: string; // TODO need to store this in contract
  owner: string; // address
  type: RecordType;
  status: RecordStatus;
  token: IToken;
  term: ITerm; // address
  depositAmount: string;
  withdrewAmount?: string;
  createdAt: number;
  maturedAt: number;
  withdrewAt?: number; // can a deposit order withdrew multiple times
  contract: Contract;
}

export enum RecordStatus {
  Lock = -1,
  DepositNormal = 10,
  DepositMatured = 12,
  DepositOverDue = 13,
  DepositClose = 14,
  LoanNormal = 20,
  LoanLiquidating = 21,
  LoanClosed = 22,
}

export const getDepositRecordStatus = async (depositInstance: Contract) => {
  // TODO: find out when will get lock status
  const isOverDue = await depositInstance.methods.isOverDue().call();
  const isWithdrawn = await depositInstance.methods.isWithdrawn().call();
  const isMatured = await depositInstance.methods.isMatured().call();
  if (isWithdrawn) {
    return RecordStatus.DepositClose;
  } else if (isOverDue) {
    return RecordStatus.DepositOverDue;
  } else if (isMatured) {
    return RecordStatus.DepositMatured;
  }
  return RecordStatus.DepositNormal;
};

export const getLoanRecordStatus = async (
  loanContractInstance: Contract,
  loanToken: IToken,
  collateralToken: IToken,
) => {
  // TODO: find out when will get lock status
  const isClosed = await loanContractInstance.methods.isClosed().call();
  const isLiquidatable = await loanContractInstance.methods
    .isLiquidatable(loanToken.price, collateralToken.price)
    .call();
  if (isClosed) {
    return RecordStatus.LoanClosed;
  } else if (isLiquidatable) {
    return RecordStatus.LoanLiquidating;
  }
  return RecordStatus.LoanNormal;
};

export interface ILoanRecord {
  recordAddress: string; // TODO need to store this in contract
  owner: string; // address
  type: RecordType;
  status: RecordStatus;
  collateralToken: IToken;
  loanToken: IToken;
  term: ITerm;
  loanAmount: string;
  withdrewAmount?: string;
  alreadyPaidAmount?: string;
  collateralAmount: string;
  liquidatedAmount?: string;
  soldCollateralAmount?: string;
  createdAt: number;
  interest: string;
  remainingDebt: string;
}

export type IRecord = IDepositRecord | ILoanRecord;
