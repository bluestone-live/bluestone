import { getContracts, getContractEventFlow } from './Web3Service';
import { accountStore } from '../index';
import { BigNumber } from '../../utils/BigNumber';
import { IGetDepositTransactionResponse } from '../../constants/Transaction';

export const isDepositAssetEnabled = async (
  tokenAddress: string,
): Promise<boolean> => {
  const contract = await getContracts();
  return contract.DepositManager.methods
    .isDepositAssetEnabled(tokenAddress)
    .call();
};

export const getDepositInterestRate = async (
  tokenAddress: string,
  term: number,
): Promise<BigNumber> => {
  const contract = await getContracts();
  return contract.DepositManager.methods
    .getDepositInterestRate(tokenAddress, term)
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
) => {
  const caller = await getContractEventFlow(
    'DepositManager',
    'DepositSuccessful',
    { filter: { user: accountStore.defaultAccount } },
  );

  return caller(DepositManager => {
    DepositManager.methods
      .deposit(assetAddress, term, amount.toString(), isRecurring)
      .send({ from: accountStore.defaultAccount });
  });
};

export const getDepositTransactions = async (): Promise<
  IGetDepositTransactionResponse[]
> => {
  // TODO: use real data instead
  // TODO: call DepositContractInstance.isOverDue().call() to get if deposit over due.
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
      isOverDue: false,
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
      isOverDue: true,
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
  isOverDue: true,
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
