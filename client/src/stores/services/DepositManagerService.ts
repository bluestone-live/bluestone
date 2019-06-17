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

/**
 * deposit token
 * @param isRecurring: is auto renew
 * @returns Promise<depositId>
 */
export const deposit = async (
  assetAddress: string,
  term: number,
  amount: BigNumber,
  isRecurring: string,
): Promise<number> => {
  const contract = await getContracts();
  return contract.DepositManager.methods
    .deposit(assetAddress, term, amount, isRecurring)
    .call();
};
