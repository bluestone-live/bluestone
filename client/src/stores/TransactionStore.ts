import { observable, action } from 'mobx';
import { IToken } from './TokenStore';
import { deposit } from './services/DepositManagerService';
import { BigNumber } from '../utils/BigNumber';

export enum TransactionType {
  Deposit,
  Loan,
  DepositWithdraw,
  CollateralWithdraw,
  CollateralAdd,
}

export interface ITransaction {
  transactionId: number;
  type: TransactionType;
  token: IToken;
  term: number;
  amount: BigNumber;
  extra: any;
}

/**
 * For display, merge deposit and loan into one store
 */
export class TransactionStore {
  @observable transactions: Map<number, ITransaction> = new Map();

  @action.bound
  saveOrUpdateTransaction(transaction: ITransaction) {
    this.transactions.set(transaction.transactionId, transaction);
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
    return this.saveOrUpdateTransaction({
      transactionId: depositId,
      type: TransactionType.Deposit,
      token,
      term,
      amount,
      extra: {
        isRecurring,
      },
    });
  }
}
