import { getContracts } from './Web3Service';

export const isDepositAssetEnabled = async (
  tokenAddress: string,
): Promise<boolean> => {
  const contract = await getContracts();
  return contract.DepositManager.methods
    .isDepositAssetEnabled(tokenAddress)
    .call();
};
