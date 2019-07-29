import { getContracts, getContractEventFlow } from './Web3Service';
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
  const flow = await getContractEventFlow(
    'DepositManager',
    'DepositSuccessful',
    { filter: { user: accountStore.defaultAccount } },
  );

  return flow(DepositManager =>
    DepositManager.methods
      .deposit(assetAddress, term, amount.toString(), isRecurring)
      .send({ from: accountStore.defaultAccount }),
  );
};

export const getDepositRecords = async (): Promise<string[]> => {
  const contracts = await getContracts();
  return contracts.DepositManager.methods
    .getDepositsByUser(accountStore.defaultAccount)
    .call();
};

export const toggleRenewal = async (
  depositAddress: string,
  enableRecurring: boolean,
) => {
  const flow = await getContractEventFlow(
    'DepositManager',
    'SetRecurringDepositSuccessful',
    { filter: { user: accountStore.defaultAccount } },
  );

  return flow(DepositManager =>
    DepositManager.methods
      .setRecurringDeposit(depositAddress, enableRecurring)
      .send({ from: accountStore.defaultAccount }),
  );
};

export const withdraw = async (depositAddress: string) => {
  const flow = await getContractEventFlow(
    'DepositManager',
    'WithdrawDepositSuccessful',
    { filter: { user: accountStore.defaultAccount } },
  );

  return flow(DepositManager =>
    DepositManager.methods
      .withdraw(depositAddress)
      .send({ from: accountStore.defaultAccount }),
  );
};
