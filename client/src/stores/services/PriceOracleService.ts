import { getContracts } from './Web3Service';

export const getPrice = async (tokenAddress: string): Promise<number> => {
  const contracts = await getContracts();
  return contracts.PriceOracle.methods.getPrice(tokenAddress).call();
};
