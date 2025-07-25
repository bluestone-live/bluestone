import { ITransaction } from '../../stores';
import { EventData } from 'web3-eth-contract';
import { EventName } from '../../utils/MetaMaskProvider';

export const getTransactionPipe = async (
  event: EventData,
  getTimestampByBlockHash: (blockHash: string) => Promise<string | number>,
): Promise<ITransaction> => {
  let amount: string;

  switch (event.event as EventName) {
    case EventName.AddCollateralSucceed:
    case EventName.SubtractCollateralSucceed:
      amount = event.returnValues.collateralAmount;
      break;
    case EventName.LoanSucceed:
      amount = event.returnValues.loanAmount;
      break;
    case EventName.RepayLoanSucceed:
      amount = event.returnValues.repayAmount;
      break;
    case EventName.LiquidateLoanSucceed:
      amount = event.returnValues.liquidateAmount;
      break;
    default:
      amount = event.returnValues.amount;
  }

  return {
    transactionHash: event.transactionHash,
    event: event.event as EventName,
    recordId: event.returnValues.recordId,
    amount,
    time: await getTimestampByBlockHash(event.blockHash),
  };
};
