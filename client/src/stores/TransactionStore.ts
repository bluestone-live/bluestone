import { observable, action, computed } from 'mobx';
import {
  deposit,
  getDepositTransactions,
  toggleRenewal,
  withdraw,
} from './services/DepositManagerService';
import { BigNumber } from '../utils/BigNumber';
import {
  ITransaction,
  IDepositTransaction,
  ILoanTransaction,
} from '../constants/Transaction';
import { IToken } from '../constants/Token';
import { tokenStore } from '.';
import * as LoanManagerService from './services/LoanManagerService';
import { getDeposit } from './services/DepositService';

/**
 * repayLoandisplay, merge deposit and loan into one store
 */
export class TransactionStore {
  @observable transactionMap: Map<string, ITransaction> = new Map();

  // deposit
  @action.bound
  saveOrUpdateDepositTransactions(
    transactions: Array<IDepositTransaction | null>,
  ) {
    return transactions.forEach(tx => {
      if (!tx) {
        return;
      }
      const token = tokenStore.getToken(tx.token.symbol);
      if (!token) {
        // TODO maybe we can ignore this record
        throw new Error('invalid token');
      }
      this.transactionMap.set(tx.transactionAddress, tx);
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
    const depositEvent = await deposit(
      token.address,
      term,
      amount,
      isRecurring,
    );
    const depositAddress = depositEvent.returnValues.deposit;
    const depositRecord = await getDeposit(depositAddress);
    return this.saveOrUpdateDepositTransactions([depositRecord]);
  }

  @action.bound
  async getDepositTransactions() {
    const depositAddresses = await getDepositTransactions();
    return this.saveOrUpdateDepositTransactions(
      await Promise.all(depositAddresses.map(getDeposit)),
    );
  }

  @action.bound
  async updateDeposit(depositAddress: string) {
    const depositRecord = await getDeposit(depositAddress);
    return this.saveOrUpdateDepositTransactions([depositRecord]);
  }

  @action.bound
  async getDepositTransactionByAddress(transactionAddress: string) {
    const depositTransaction = await getDeposit(transactionAddress);
    return this.saveOrUpdateDepositTransactions([depositTransaction]);
  }

  @action.bound
  toggleRenewal(depositAddress: string, enableRecurring: boolean) {
    return toggleRenewal(depositAddress, enableRecurring);
  }

  @action.bound
  withdrawDeposit(transactionAddress: string) {
    return withdraw(transactionAddress);
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

  // loan
  @action.bound
  async loan(
    term: number,
    loanToken: IToken,
    collateralToken: IToken,
    loanAmount: BigNumber,
    collateralAmount: BigNumber,
    requestedFreedCollateral: BigNumber,
  ) {
    await LoanManagerService.loan(
      term,
      loanToken.address,
      collateralToken.address,
      loanAmount,
      collateralAmount,
      requestedFreedCollateral,
    );

    // TODOrepayLoan transaction
  }

  @action.bound
  async getLoans() {
    const loanTransactions = await LoanManagerService.getLoans();
    // return this.saveOrUpdateLoanTransactions(
    //   loanTransactions.map(tx => {
    //     const term = terms.find(t => tx.term === t.value)!;
    //     return {
    //       ...tx,
    //       type: TransactionType.Loan,
    //       status: getLoanTransactionStatus(tx),
    //       term,
    //     };
    //   }),
    // );
  }

  @action.bound
  withdrawCollateral(transactionId: string, amount: BigNumber) {
    return LoanManagerService.withdrawFreedCollateral(transactionId, amount);
  }

  @action.bound
  addCollateral(transactionId: string, amount: BigNumber) {
    return LoanManagerService.addCollateral(transactionId, amount);
  }

  @action.bound
  repay(transactionAddress: string, amount: BigNumber) {
    const transaction = this.transactionMap.get(
      transactionAddress,
    ) as ILoanTransaction;
    if (!transaction) {
      // TODO alert error message to user
      return;
    }
    return LoanManagerService.repayLoan(
      transaction.loanToken.address,
      transaction.collateralToken.address,
      transactionAddress,
      amount,
    );
  }
}
