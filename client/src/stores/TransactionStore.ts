import { observable, action } from 'mobx';
import {
  getLoanSuccessfulEvents,
  getAddCollateralSuccessfulEvents,
  getDepositSuccessfulEvents,
  getRepayLoanSuccessfulEvents,
  getSetRecurringDepositSuccessfulEvents,
  getWithdrawDepositSuccessfulEvents,
  getWithdrawFreedCollatteralSuccessfulEvents,
} from './services/TransactionService';
import { ITransaction } from '../constants/Transaction';
import { EventData } from 'web3-eth-contract';

export class TransactionStore {
  @observable loanTransactions: Map<string, ITransaction[]> = new Map<
    string,
    ITransaction[]
  >();
  @observable depositTransactions: Map<string, ITransaction[]> = new Map<
    string,
    ITransaction[]
  >();

  @action.bound
  async getDepositTransactions() {
    const res = await Promise.all([
      getDepositSuccessfulEvents(),
      getSetRecurringDepositSuccessfulEvents(),
      getWithdrawDepositSuccessfulEvents(),
    ]);
    this.setDepositTransactions(
      res.reduce<any[]>((flapArray, events) => [...flapArray, ...events], []),
    );
  }

  @action.bound
  async setDepositTransactions(events: EventData[]) {
    events.forEach(event => {
      const recordAddress = event.returnValues.deposit;
      if (this.loanTransactions.has(event.returnValues.loan)) {
        const transactions = this.loanTransactions.get(recordAddress);
        this.loanTransactions.set(event.returnValues.loan, [
          ...transactions!,
          {
            transactionHash: event.transactionHash,
            event: event.event,
            recordAddress,
          },
        ]);
      } else {
        this.loanTransactions.set(event.returnValues.loan, [
          {
            transactionHash: event.transactionHash,
            event: event.event,
            recordAddress,
          },
        ]);
      }
    });
  }

  @action.bound
  async getLoanTransactions() {
    const res = await Promise.all([
      getLoanSuccessfulEvents(),
      getAddCollateralSuccessfulEvents(),
      getRepayLoanSuccessfulEvents(),
      getWithdrawFreedCollatteralSuccessfulEvents(),
    ]);
    this.setLoanTransactions(
      res.reduce<any[]>((flapArray, events) => [...flapArray, ...events], []),
    );
  }

  @action.bound
  setLoanTransactions(events: EventData[]) {
    events.forEach(event => {
      const recordAddress = event.returnValues.loan;
      if (this.loanTransactions.has(event.returnValues.loan)) {
        const transactions = this.loanTransactions.get(recordAddress);
        this.loanTransactions.set(event.returnValues.loan, [
          ...transactions!,
          {
            transactionHash: event.transactionHash,
            event: event.event,
            recordAddress,
          },
        ]);
      } else {
        this.loanTransactions.set(event.returnValues.loan, [
          {
            transactionHash: event.transactionHash,
            event: event.event,
            recordAddress,
          },
        ]);
      }
    });
  }
}
