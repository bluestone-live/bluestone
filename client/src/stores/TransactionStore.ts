import { observable, action } from 'mobx';
import {
  getLoanSuccessfulEvents,
  getAddCollateralSuccessfulEvents,
  getDepositSuccessfulEvents,
  getRepayLoanSuccessfulEvents,
  getWithdrawDepositSuccessfulEvents,
  getWithdrawFreedCollatteralSuccessfulEvents,
} from './services/TransactionService';
import { ITransaction } from '../constants/Transaction';
import { EventData } from 'web3-eth-contract';
import { uniqBy } from 'lodash';
import { EventName } from '../constants/Event';
import { convertWeiToDecimal } from '../utils/BigNumber';
import { getTimestampByBlockHash } from './services/Web3Service';

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
      getWithdrawDepositSuccessfulEvents(),
    ]);
    this.setDepositTransactions(
      await Promise.all(
        res
          .reduce<any[]>((flapArray, events) => [...flapArray, ...events], [])
          .map(async event => this.formatTransaction('deposit', event)),
      ),
    );
  }

  @action.bound
  async setDepositTransactions(transactions: ITransaction[]) {
    transactions.forEach(transaction => {
      const recordAddress = transaction.recordAddress;

      if (this.depositTransactionMap.has(recordAddress)) {
        const originalTransactions = this.depositTransactionMap.get(
          recordAddress,
        );
        this.depositTransactionMap.set(
          recordAddress,
          uniqBy(
            [...(originalTransactions || []), transaction],
            'transactionHash',
          ),
        );
      } else {
        this.depositTransactionMap.set(recordAddress, [transaction]);
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
      await Promise.all(
        res
          .reduce<any[]>((flapArray, events) => [...flapArray, ...events], [])
          .map(async event => this.formatTransaction('loan', event)),
      ),
    );
  }

  @action.bound
  async formatTransaction(recordType: 'loan' | 'deposit', event: EventData) {
    const time = await getTimestampByBlockHash(event.blockHash);

    return {
      transactionHash: event.transactionHash,
      event: event.event as EventName,
      recordAddress:
        recordType === 'loan'
          ? event.returnValues.loan
          : event.returnValues.deposit,
      amount: convertWeiToDecimal(event.returnValues.amount),
      time: Number.parseInt(time.toString(), 10) * 1000,
    };
  }

  @action.bound
  setLoanTransactions(transactions: ITransaction[]) {
    transactions.forEach(transaction => {
      const recordAddress = transaction.recordAddress;

      if (this.loanTransactionMap.has(recordAddress)) {
        const originalTransactions = this.loanTransactionMap.get(recordAddress);
        this.loanTransactionMap.set(
          recordAddress,
          uniqBy(
            [...(originalTransactions || []), transaction],
            'transactionHash',
          ),
        );
      } else {
        this.loanTransactionMap.set(recordAddress, [transaction]);
      }
    });
  }
}
