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
import {
  loan,
  getLoanTransactions,
  repayLoan,
  addCollateral,
  withdrawFreedCollateral,
} from './services/LoanManagerService';
import { getDeposit } from './services/DepositService';
import { getLoan } from './services/LoanService';

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
      this.transactionMap.set(tx.transactionAddress, tx);
    });
  }

  @computed get transactions() {
    return Array.from(this.transactionMap.values()).sort(
      (t1, t2) => t2.createdAt - t1.createdAt,
    );
  }

  @action.bound
  getTransactionByAddress(transactionAddress: string) {
    return this.transactionMap.get(transactionAddress);
  }

  @action.bound
  async deposit(
    token: IToken,
    term: number,
    amount: BigNumber,
    isRecurring: boolean,
  ) {
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
  saveOrUpdateLoanTransactions(transactions: Array<ILoanTransaction | null>) {
    return transactions.forEach(tx => {
      if (!tx) {
        return;
      }
      this.transactionMap.set(tx.transactionAddress, tx);
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
    const loanEvent = await loan(
      term,
      loanToken.address,
      collateralToken.address,
      loanAmount,
      collateralAmount,
      requestedFreedCollateral,
    );
    const loanTransaction = await getLoan(loanEvent.returnValues.loan);
    this.saveOrUpdateLoanTransactions([loanTransaction]);
  }

  @action.bound
  async getLoanTransactions() {
    const loanTransactions = await getLoanTransactions();
    return this.saveOrUpdateLoanTransactions(
      await Promise.all(loanTransactions.map(getLoan)),
    );
  }

  @action.bound
  async updateLoanTransaction(loanAddress: string) {
    return this.saveOrUpdateLoanTransactions([await getLoan(loanAddress)]);
  }

  @action.bound
  withdrawCollateral(transactionId: string, amount: BigNumber) {
    return withdrawFreedCollateral(transactionId, amount);
  }

  @action.bound
  addCollateral(
    transactionId: string,
    amount: BigNumber,
    requestedFreedCollateral: BigNumber,
  ) {
    return addCollateral(transactionId, amount, requestedFreedCollateral);
  }

  @action.bound
  repay(transactionAddress: string, amount: BigNumber) {
    return repayLoan(transactionAddress, amount);
  }
}
