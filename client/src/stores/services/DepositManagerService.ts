import { getContracts } from './Web3Service';
import { accountStore } from '../index';
import { BigNumber } from '../../utils/BigNumber';
import { IAnnualPercentageRateValues } from '../../constants/Rate';
import { IGetDepositTransactionResponse } from '../../constants/Transaction';

export const isDepositAssetEnabled = async (
  tokenAddress: string,
): Promise<boolean> => {
  const contract = await getContracts();
  return contract.DepositManager.methods
    .isDepositAssetEnabled(tokenAddress)
    .call();
};

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

export const getDepositTransactions = async (): Promise<
  IGetDepositTransactionResponse[]
> => {
  // TODO: use real data instead
  return [
    {
      owner: 'xxx',
      transactionId: '1',
      token: 'ETH',
      term: 7,
      depositAmount: 1e18,
      isRecurring: true,
      interestRate: 0.3,
      createdAt: 0,
      maturedAt: 100,
    },
    {
      owner: 'xxx',
      transactionId: '2',
      token: 'DAI',
      term: 30,
      depositAmount: 1e20,
      isRecurring: false,
      interestRate: 0.3,
      createdAt: 0,
      maturedAt: 100,
    },
  ];
};

export const getDepositTransactionById = async (
  transactionId: string,
): Promise<IGetDepositTransactionResponse> => ({
  owner: 'xxx',
  transactionId,
  token: 'DAI',
  term: 30,
  depositAmount: 1e20,
  isRecurring: false,
  interestRate: 0.3,
  createdAt: 0,
  maturedAt: 100,
});

export const toggleRenewal = async (autoRenewal: boolean): Promise<string> => {
  // TODO call contract method
  return `Ox${Math.random()
    .toString()
    .replace(/\.*/g, '')}`;
};

export const withdraw = async (
  transactionId: string,
  amount: number,
): Promise<string> => {
  // TODO send to contract and get txid back
  return `Ox${Math.random()
    .toString()
    .replace(/\.*/g, '')}`;
};
