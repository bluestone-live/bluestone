import { getContracts } from './Web3Service';

export const getTokenManagerAddress = async () => {
  const contracts = await getContracts();
  return contracts.TokenManager.address;
};
