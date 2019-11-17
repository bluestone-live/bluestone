import { EventName } from '../utils/MetaMaskProvider';
import { IAction } from '.';
import { Dayjs } from 'dayjs';

export enum TransactionActionType {
  ReplaceTransactions = 'REPLACE_TRANSACTIONS',
}

export interface ITransaction {
  transactionHash: string;
  event: EventName;
  recordId: string;
  time: Dayjs;
  amount: string;
}

interface ITransactionState {
  transactions: ITransaction[];
}

const initState: ITransactionState = {
  transactions: [],
};

export const TransactionReducer = (
  state: ITransactionState = initState,
  action: IAction<TransactionActionType>,
) => {
  switch (action.type) {
    case TransactionActionType.ReplaceTransactions:
      return { ...state, transactions: action.payload.transactions };
    default:
      return state;
  }
};

export class TransactionActions {
  static replaceTransactions(transactions: ITransaction[]) {
    return {
      type: TransactionActionType.ReplaceTransactions,
      payload: {
        transactions,
      },
    };
  }
}
