import { observable, action, computed } from 'mobx';
import {
  deposit,
  getDepositRecords,
  toggleRenewal,
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
  withdrawFreedCollateral,
} from './services/LoanManagerService';
import { getDeposit } from './services/DepositService';
import { getLoan } from './services/LoanService';

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
    return Array.from(this.depositRecordMap.values());
  }

  @computed get loanRecords() {
    return Array.from(this.loanRecordMap.values());
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
    return this.saveOrUpdateDepositRecords([depositRecord]);
  }

  @action.bound
  async getDepositRecords() {
    const depositAddresses = (await getDepositRecords()) || [];
    return this.saveOrUpdateDepositRecords(
      await Promise.all(depositAddresses.map(getDeposit)),
    );
  }

  @action.bound
  async updateDeposit(depositAddress: string) {
    const depositRecord = await getDeposit(depositAddress);
    return this.saveOrUpdateDepositRecords([depositRecord]);
  }

  @action.bound
  async updateDepositRecordByAddress(recordAddress: string) {
    const depositRecord = await getDeposit(recordAddress);
    return this.saveOrUpdateDepositRecords([depositRecord]);
  }

  @action.bound
  toggleRenewal(depositAddress: string, enableRecurring: boolean) {
    return toggleRenewal(depositAddress, enableRecurring);
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
    const loanRecord = await getLoan(loanEvent.returnValues.loan);
    this.saveOrUpdateLoanRecords([loanRecord]);
  }

  @action.bound
  async getLoanRecords() {
    const loanRecords = (await getLoanRecords()) || [];
    return this.saveOrUpdateLoanRecords(
      await Promise.all(loanRecords.map(getLoan)),
    );
  }

  @action.bound
  async updateLoanRecordByAddress(loanAddress: string) {
    return this.saveOrUpdateLoanRecords([await getLoan(loanAddress)]);
  }

  @action.bound
  withdrawCollateral(recordAddress: string, amount: BigNumber) {
    return withdrawFreedCollateral(recordAddress, amount);
  }

  @action.bound
  addCollateral(
    recordAddress: string,
    amount: BigNumber,
    requestedFreedCollateral: BigNumber,
  ) {
    return addCollateral(recordAddress, amount, requestedFreedCollateral);
  }

  @action.bound
  repay(recordAddress: string, amount: BigNumber) {
    return repayLoan(recordAddress, amount);
  }
}
