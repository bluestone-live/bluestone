import { getContracts } from './Web3Service';

// TODO: get token address based on network. Currently only for testing.
export const getTokenAddress = async (tokenSymbol: string) => {
  const contracts = await getContracts();
  const tokenAddress = contracts.TokenFactory.methods
    .getToken(tokenSymbol)
    .call();
  return tokenAddress;
};
