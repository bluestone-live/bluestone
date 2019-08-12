import { getContracts, getContractEventFlow } from './Web3Service';
import { BigNumber } from '../../utils/BigNumber';
import { EventName } from '../../constants/Event';
import { accountStore } from '..';

export const getFreedCollateral = async (tokenAddress: string) => {
  const { AccountManager } = await getContracts();

  return AccountManager.methods.getFreedCollateral(tokenAddress).call();
};

export const withdrawFreedCollateral = async (
  tokenAddress: string,
  amount: BigNumber,
) => {
  const flow = await getContractEventFlow(
    'AccountManager',
    EventName.WithdrawFreedCollateralSuccessful,
    {
      filter: { user: accountStore.defaultAccount },
    },
  );

  return flow(AccountManager =>
    AccountManager.methods
      .withdrawFreedCollateral(tokenAddress, amount.toString())
      .send({ from: accountStore.defaultAccount }),
  );
};
