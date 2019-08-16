import { getContracts } from './Web3Service';
import { BigNumber } from '../../utils/BigNumber';

export const getPrice = async (tokenAddress: string): Promise<BigNumber> => {
  const contracts = await getContracts();
  return contracts.PriceOracle.methods.getPrice(tokenAddress).call();
};
