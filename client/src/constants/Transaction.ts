import { EventName } from './Event';

export interface ITransaction {
  transactionHash: string;
  event: EventName;
  recordAddress: string;
  time: number;
  amount: string;
}
