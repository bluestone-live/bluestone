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
  getLoanTransactionStatus,
} from '../constants/Transaction';
import { IToken } from '../constants/Token';
import { tokenStore } from '.';
import { terms } from '../constants/Term';
import {
  withdrawCollateral,
  addCollateral,
  repay,
  getLoanTransactions,
  getLoanTransactionById,
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
        const term = terms.find(t => t.value === tx.term);
        if (!token || !term) {
          throw new Error('invalid token or term');
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
    const term = terms.find(t => t.value === depositTransaction.term)!;
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
  saveOrUpdateLoanTransactions(transactions: ILoanTransaction[]) {
    return transactions.forEach(tx => {
      const loanToken = tokenStore.getToken(tx.loanToken.symbol);
      const collateralToken = tokenStore.getToken(tx.loanToken.symbol);
      if (!loanToken || !collateralToken) {
        // TODO maybe we can ignore this record
        throw new Error('invalid token');
      }
      this.transactionMap.set(tx.transactionId, tx);
    });
  }

  @action.bound
  async getLoanTransactions(loanToken: IToken, collateralToken: IToken) {
    const loanTransactions = await getLoanTransactions(
      loanToken.address,
      collateralToken.address,
    );
    return this.saveOrUpdateLoanTransactions(
      loanTransactions.map(tx => {
        const term = terms.find(t => tx.term === t.value)!;
        if (!loanToken || !collateralToken) {
          throw new Error('invalid token');
        }
        return {
          ...tx,
          type: TransactionType.Loan,
          status: getLoanTransactionStatus(tx),
          loanToken,
          collateralToken,
          term,
        };
      }),
    );
  }

  @action.bound
  async getLoanTransactionById(transactionId: string) {
    const loanTransaction = await getLoanTransactionById(transactionId);
    const loanToken = tokenStore.getToken(loanTransaction.loanToken!);
    const collateralToken = tokenStore.getToken(
      loanTransaction.collateralToken!,
    );
    if (!loanToken || !collateralToken) {
      throw new Error('invalid token');
    }
    const term = terms.find(t => t.value === loanTransaction.term)!;
    return this.saveOrUpdateLoanTransactions([
      {
        ...loanTransaction,
        type: TransactionType.Loan,
        status: getLoanTransactionStatus(loanTransaction),
        loanToken,
        collateralToken,
        term,
      },
    ]);
  }

  @action.bound
  toggleRenewal(autoRenewal: boolean) {
    return toggleRenewal(autoRenewal);
  }

  @action.bound
  withdrawDeposit(transactionId: string, amount: number) {
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
