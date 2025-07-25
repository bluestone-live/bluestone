import { EventName, MetaMaskProvider } from '../../utils/MetaMaskProvider';
import { getTransactionPipe } from './Pipes';

export class TransactionService {
  constructor(private readonly provider: MetaMaskProvider) {}

  getActionTransactions = async (accountAddress: string) =>
    Promise.all(
      (await Promise.all([
        this.getLoanSucceedEvents(accountAddress),
        this.getRepayLoanSucceedEvents(accountAddress),
        this.getAddCollateralSucceedEvents(accountAddress),
        this.getSubtractCollateralSucceedEvents(accountAddress),
        this.getDepositSucceedEvents(accountAddress),
        this.getWithdrawDepositSucceedEvents(accountAddress),
        this.getEarlyWithdrawDepositSucceedEvents(accountAddress),
        this.getLiquidateLoanSucceedEvents(accountAddress),
      ]))
        .reduce((allEvents, eventArray) => [...allEvents, ...eventArray], [])
        .map(event =>
          getTransactionPipe(event, this.provider.getTimestampByBlockHash),
        ),
    );

  getLoanSucceedEvents = async (accountAddress: string) =>
    this.provider.getPastEvents(accountAddress, EventName.LoanSucceed);
  getRepayLoanSucceedEvents = async (accountAddress: string) =>
    this.provider.getPastEvents(accountAddress, EventName.RepayLoanSucceed);
  getAddCollateralSucceedEvents = async (accountAddress: string) =>
    this.provider.getPastEvents(accountAddress, EventName.AddCollateralSucceed);
  getSubtractCollateralSucceedEvents = async (accountAddress: string) =>
    this.provider.getPastEvents(
      accountAddress,
      EventName.SubtractCollateralSucceed,
    );
  getDepositSucceedEvents = async (accountAddress: string) =>
    this.provider.getPastEvents(accountAddress, EventName.DepositSucceed);
  getWithdrawDepositSucceedEvents = async (accountAddress: string) =>
    this.provider.getPastEvents(accountAddress, EventName.WithdrawSucceed);
  getEarlyWithdrawDepositSucceedEvents = async (accountAddress: string) =>
    this.provider.getPastEvents(accountAddress, EventName.EarlyWithdrawSucceed);
  getLiquidateLoanSucceedEvents = async (accountAddress: string) =>
    this.provider.getPastEvents(accountAddress, EventName.LiquidateLoanSucceed);
}
