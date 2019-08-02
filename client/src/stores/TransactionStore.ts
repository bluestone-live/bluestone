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
import { uniqBy } from 'lodash';

export class TransactionStore {
  @observable loanTransactionMap: Map<string, ITransaction[]> = new Map<
    string,
    ITransaction[]
  >();
  @observable depositTransactionMap: Map<string, ITransaction[]> = new Map<
    string,
    ITransaction[]
  >();

  @action.bound
  getLoanTransactionByRecordAddress(recordAddress: string) {
    return this.loanTransactionMap.get(recordAddress);
  }

  @action.bound
  getDepositTransactionByRecordAddress(recordAddress: string) {
    return this.depositTransactionMap.get(recordAddress);
  }

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

      if (this.depositTransactionMap.has(recordAddress)) {
        const transactions = this.depositTransactionMap.get(recordAddress);
        this.depositTransactionMap.set(
          recordAddress,
          uniqBy(
            [
              ...transactions!,
              {
                transactionHash: event.transactionHash,
                event: event.event,
                recordAddress,
              },
            ],
            'transactionHash',
          ),
        );
      } else {
        this.depositTransactionMap.set(recordAddress, [
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
      if (this.loanTransactionMap.has(recordAddress)) {
        const transactions = this.loanTransactionMap.get(recordAddress);
        this.loanTransactionMap.set(
          recordAddress,
          uniqBy(
            [
              ...transactions!,
              {
                transactionHash: event.transactionHash,
                event: event.event,
                recordAddress,
              },
            ],
            'transactionHash',
          ),
        );
      } else {
        this.loanTransactionMap.set(recordAddress, [
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
