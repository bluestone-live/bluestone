import { getContracts } from './Web3Service';
import { BigNumber } from '../../utils/BigNumber';
import { EventName } from '../../constants/Event';
import { EventData } from 'web3-eth-contract';

export const getProtocolReserveRatio = async () => {
  const contract = await getContracts();
  return contract.Configuration.methods.getProtocolReserveRatio().call();
};

export const getLoanInterestRate = async (
  tokenAddress: string,
  term: number,
): Promise<BigNumber> => {
  const contract = await getContracts();
  return contract.Configuration.methods
    .getLoanInterestRate(tokenAddress, term)
    .call();
};

export const getCollateralRatio = async (
  loanTokenAddress: string,
  collateralTokenAddress: string,
) => {
  const contract = await getContracts();
  return contract.Configuration.methods
    .getCollateralRatio(loanTokenAddress, collateralTokenAddress)
    .call();
};

export const isUserActionsLocked = async () => {
  const contract = await getContracts();
  return contract.Configuration.methods.isUserActionsLocked().call();
};

export const listenUserActionsLockChangeEvent = async (
  action: (isUserActionsLocked: boolean, triggerByEvent: boolean) => void,
) => {
  const { Configuration } = await getContracts();
  Configuration.events[EventName.LockUserActions](
    {},
    (err: Error, _: EventData) => {
      if (!err) {
        action(true, true);
      }
    },
  );
  Configuration.events[EventName.UnlockUserActions](
    {},
    (err: Error, _: EventData) => {
      if (!err) {
        action(false, true);
      }
    },
  );
};
