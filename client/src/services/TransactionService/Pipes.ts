import { ITransaction } from '../../stores';
import { EventData } from 'web3-eth-contract';
import { EventName } from '../../utils/MetaMaskProvider';

export const getTransactionPipe = async (
  event: EventData,
  getTimestampByBlockHash: (blockHash: string) => Promise<string | number>,
): Promise<ITransaction> => ({
  transactionHash: event.transactionHash,
  event: event.event as EventName,
  recordId: event.returnValues.recordId,
  amount:
    (event.event as EventName) === EventName.AddCollateralSucceed
      ? event.returnValues.collateralAmount
      : event.returnValues.amount,
  time: await getTimestampByBlockHash(event.blockHash),
});
