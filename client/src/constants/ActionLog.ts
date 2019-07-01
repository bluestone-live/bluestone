import { IToken } from './Token';

export enum ActionType {
  Deposit,
  WithdrawDeposit,
  AutoRenewDeposit,
  Loan,
  AddCollateral,
  WithdrawCollateral,
  Repay,
}

export interface IActionLog {
  actionType: ActionType;
  token: IToken;
  txid: string;
  link: string;
}
