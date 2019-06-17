import { getContracts } from './Web3Service';
import { BigNumber } from '../../utils/BigNumber';

export const isDepositAssetEnabled = async (
  tokenAddress: string,
): Promise<boolean> => {
  const contract = await getContracts();
  return contract.DepositManager.methods
    .isDepositAssetEnabled(tokenAddress)
    .call();
};

export interface IAnnualPercentageRateValues {
  [term: number]: BigNumber;
}

export const getDepositInterestRates = async (
  tokenAddress: string,
): Promise<IAnnualPercentageRateValues> => {
  const contract = await getContracts();
  return contract.DepositManager.methods
    .getDepositInterestRates(tokenAddress)
    .call();
};
