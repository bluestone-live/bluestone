import { getContracts } from './Web3Service';
import { accountStore } from '..';
import { BigNumber } from '../../utils/BigNumber';

export const wrap = async (amount: BigNumber) => {
  const contracts = await getContracts();
  return contracts.WETH.deposit().send({
    from: accountStore.defaultAccount,
    value: amount.toString(),
  });
};

export const unwrap = async (amount: BigNumber) => {
  const contracts = await getContracts();
  return contracts.WETH.withdraw(amount.toString()).send({
    from: accountStore.defaultAccount,
  });
};
