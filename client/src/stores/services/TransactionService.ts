import { getPastEvents } from './Web3Service';
import { EventName } from '../../constants/Event';

export const getLoanSuccessfulEvents = async () =>
  getPastEvents('LoanManager', EventName.LoanSuccessful);
export const getRepayLoanSuccessfulEvents = async () =>
  getPastEvents('LoanManager', EventName.RepayLoanSuccessful);
export const getAddCollateralSuccessfulEvents = async () =>
  getPastEvents('LoanManager', EventName.AddCollateralSuccessful);
export const getWithdrawFreedCollatteralSuccessfulEvents = async () =>
  getPastEvents('AccountManager', EventName.WithdrawFreedCollateralSuccessful);

export const getDepositSuccessfulEvents = async () =>
  getPastEvents('DepositManager', EventName.DepositSuccessful);
export const getWithdrawDepositSuccessfulEvents = async () =>
  getPastEvents('DepositManager', EventName.WithdrawDepositSuccessful);
