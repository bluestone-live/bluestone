import { observable, action, computed } from 'mobx';
import {
  deposit,
  getDepositTransactions,
  toggleRenewal,
  withdraw,
  getDepositTransactionById,
} from './services/DepositManagerService';
import { BigNumber } from '../utils/BigNumber';
import {
  ITransaction,
  IDepositTransaction,
  ILoanTransaction,
  getDepositTransactionStatus,
  TransactionType,
} from '../constants/Transaction';
import { IToken } from '../constants/Token';
import { tokenStore } from '.';
import { terms } from '../constants/Term';
import {
  withdrawCollateral,
  addCollateral,
  repay,
} from './services/LoanManagerService';

/**
 * For display, merge deposit and loan into one store
 */
export class TransactionStore {
  @observable transactionMap: Map<string, ITransaction> = new Map();

  // deposit
  @action.bound
  saveOrUpdateDepositTransactions(transactions: IDepositTransaction[]) {
    return transactions.forEach(tx => {
      const token = tokenStore.getToken(tx.token.symbol);
      if (!token) {
        // TODO maybe we can ignore this record
        throw new Error('invalid token');
      }
      this.transactionMap.set(tx.transactionId, tx);
    });
  }

  @action.bound
  saveOrUpdateLoanTransactions(transactions: ILoanTransaction[]) {
    return transactions.forEach(tx => {
      this.transactionMap.set(tx.transactionId, tx);
    });
  }

  @computed get transactions() {
    return Array.from(this.transactionMap.values());
  }

  @action.bound
  async deposit(
    token: IToken,
    term: number,
    amount: BigNumber,
    isRecurring: boolean,
  ) {
    // TODO throw an error: invalid number value
    const depositId = await deposit(token.address, term, amount, isRecurring);
    // TODO need to declare the return type
    // return this.saveOrUpdateTransaction({
    //   transactionId: depositId,
    //   type: TransactionType.Deposit,
    //   token,
    //   term,
    //   amount,
    //   extra: {
    //     isRecurring,
    //   },
    // });
  }

  @action.bound
  async getDepositTransactions() {
    const depositTransactions = await getDepositTransactions();
    return this.saveOrUpdateDepositTransactions(
      depositTransactions.map(tx => {
        const token = tokenStore.getToken(tx.token);
        const term = terms[tx.term];
        if (!token) {
          throw new Error('invalid token');
        }
        return {
          ...tx,
          type: TransactionType.Deposit,
          status: getDepositTransactionStatus(tx),
          token,
          term,
        };
      }),
    );
  }

  @action.bound
  async getDepositTransactionById(transactionId: string) {
    const depositTransaction = await getDepositTransactionById(transactionId);
    const token = tokenStore.getToken(depositTransaction.token);
    const term = terms[depositTransaction.term];
    if (!token) {
      throw new Error('invalid token');
    }
    return this.saveOrUpdateDepositTransactions([
      {
        ...depositTransaction,
        type: TransactionType.Deposit,
        status: getDepositTransactionStatus(depositTransaction),
        token,
        term,
      },
    ]);
  }

  @action.bound
  toggleRenewal(autoRenewal: boolean) {
    return toggleRenewal(autoRenewal);
  }

  @action.bound
  withdraw(transactionId: string, amount: number) {
    return withdraw(transactionId, amount);
  }

  // loan
  @action.bound
  withdrawCollateral(transactionId: string, amount: number) {
    return withdrawCollateral(transactionId, amount);
  }

  @action.bound
  addCollateral(transactionId: string, amount: number) {
    return addCollateral(transactionId, amount);
  }

  @action.bound
  repay(transactionId: string, amount: number) {
    return repay(transactionId, amount);
  }
}
