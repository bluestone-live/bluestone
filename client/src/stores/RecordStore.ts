import { observable, action, computed } from 'mobx';
import {
  deposit,
  getDepositRecords,
  withdraw,
} from './services/DepositManagerService';
import { BigNumber } from '../utils/BigNumber';
import { IDepositRecord, ILoanRecord } from '../constants/Record';
import { IToken } from '../constants/Token';
import {
  loan,
  getLoanRecords,
  repayLoan,
  addCollateral,
} from './services/LoanManagerService';
import { getDeposit } from './services/DepositService';
import { getLoan } from './services/LoanService';
import { loanManagerStore, depositManagerStore } from '.';

export class RecordStore {
  @observable depositRecordMap: Map<string, IDepositRecord> = new Map();
  @observable loanRecordMap: Map<string, ILoanRecord> = new Map();

  // deposit
  @action.bound
  saveOrUpdateDepositRecords(records: Array<IDepositRecord | null>) {
    return records.forEach(tx => {
      if (!tx) {
        return;
      }
      this.depositRecordMap.set(tx.recordAddress, tx);
    });
  }

  @computed get depositRecords() {
    return Array.from(this.depositRecordMap.values()).sort(
      (deposit1, deposit2) => deposit2.createdAt - deposit1.createdAt,
    );
  }

  @computed get loanRecords() {
    return Array.from(this.loanRecordMap.values()).sort(
      (loan1, loan2) => loan2.createdAt - loan1.createdAt,
    );
  }

  @action.bound
  getDepositRecordByAddress(recordAddress: string) {
    return this.depositRecordMap.get(recordAddress);
  }

  @action.bound
  getLoanRecordByAddress(recordAddress: string) {
    return this.loanRecordMap.get(recordAddress);
  }

  @action.bound
  async deposit(token: IToken, term: number, amount: BigNumber) {
    const depositEvent = await deposit(token.address, term, amount);
    const depositAddress = depositEvent.returnValues.deposit;
    const depositRecord = await getDeposit(
      depositAddress,
      depositManagerStore.depositTerms,
    );
    return this.saveOrUpdateDepositRecords([depositRecord]);
  }

  @action.bound
  async getDepositRecords() {
    const depositAddresses = (await getDepositRecords()) || [];
    return this.saveOrUpdateDepositRecords(
      await Promise.all(
        depositAddresses.map((depositRecordAddress: string) =>
          getDeposit(depositRecordAddress, depositManagerStore.depositTerms),
        ),
      ),
    );
  }

  @action.bound
  async updateDeposit(depositAddress: string) {
    const depositRecord = await getDeposit(
      depositAddress,
      depositManagerStore.depositTerms,
    );
    return this.saveOrUpdateDepositRecords([depositRecord]);
  }

  @action.bound
  async updateDepositRecordByAddress(recordAddress: string) {
    const depositRecord = await getDeposit(
      recordAddress,
      depositManagerStore.depositTerms,
    );
    return this.saveOrUpdateDepositRecords([depositRecord]);
  }

  @action.bound
  withdrawDeposit(recordAddress: string) {
    return withdraw(recordAddress);
  }

  @action.bound
  saveOrUpdateLoanRecords(records: Array<ILoanRecord | null>) {
    return records.forEach(tx => {
      if (!tx) {
        return;
      }
      this.loanRecordMap.set(tx.recordAddress, tx);
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
    useFreedCollateral: boolean,
  ) {
    const loanEvent = await loan(
      term,
      loanToken.address,
      collateralToken.address,
      loanAmount,
      collateralAmount,
      useFreedCollateral,
    );
    const loanRecord = await getLoan(
      loanEvent.returnValues.loan,
      loanManagerStore.loanTerms,
    );
    this.saveOrUpdateLoanRecords([loanRecord]);
  }

  @action.bound
  async getLoanRecords() {
    const loanRecords = (await getLoanRecords()) || [];
    return this.saveOrUpdateLoanRecords(
      await Promise.all(
        loanRecords.map((loanRecordAddress: string) =>
          getLoan(loanRecordAddress, loanManagerStore.loanTerms),
        ),
      ),
    );
  }

  @action.bound
  async updateLoanRecordByAddress(loanAddress: string) {
    return this.saveOrUpdateLoanRecords([
      await getLoan(loanAddress, loanManagerStore.loanTerms),
    ]);
  }

  @action.bound
  addCollateral(
    recordAddress: string,
    amount: BigNumber,
    useFreedCollateral: boolean,
  ) {
    return addCollateral(recordAddress, amount, useFreedCollateral);
  }

  @action.bound
  repay(recordAddress: string, amount: BigNumber) {
    return repayLoan(recordAddress, amount);
  }
}
