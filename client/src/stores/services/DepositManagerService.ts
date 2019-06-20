import { getContracts } from './Web3Service';
import { accountStore } from '../index';
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
 * @returns Promise<PromiEvent>: https://web3js.readthedocs.io/en/1.0/callbacks-promises-events.html#promievent
 */
export const deposit = async (
  assetAddress: string,
  term: number,
  amount: BigNumber,
  isRecurring: boolean,
): Promise<object> => {
  const contract = await getContracts();
  return contract.DepositManager.methods
    .deposit(assetAddress, term, amount.toString(), isRecurring)
    .send({ from: accountStore.defaultAccount });
};
