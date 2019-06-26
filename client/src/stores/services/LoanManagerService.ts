import { getContracts } from './Web3Service';
import { accountStore } from '../index';
import { BigNumber } from '../../utils/BigNumber';
import { IGetLoanTransactionResponse } from '../../constants/Transaction';

export const isLoanAssetPairEnabled = async (
  loanAssetAddress: string,
  collateralAssetAddress: string,
) => {
  const contract = await getContracts();
  return contract.LoanManager.methods
    .isLoanAssetPairEnabled(loanAssetAddress, collateralAssetAddress)
    .call();
};

export const loan = async (
  term: number,
  loanAssetAddress: string,
  collateralAssetAddress: string,
  loanAmount: BigNumber,
  collateralAmount: BigNumber,
  requestedFreedCollateral: BigNumber = new BigNumber(0),
): Promise<object> => {
  const contracts = await getContracts();
  return contracts.LoanManager.methods
    .loan(
      term,
      loanAssetAddress,
      collateralAssetAddress,
      loanAmount,
      collateralAmount,
      requestedFreedCollateral,
    )
    .send({ from: accountStore.defaultAccount });
};

export const getLoanTransactions = async (): Promise<
  IGetLoanTransactionResponse[]
> => {
  // TODO: use real data instead
  return [
    {
      transactionId: 1,
      owner: '0x111',
      term: 7,
      loanAmount: 1e18,
      minCollateralRatio: 5e17,
      interestRate: 3e15,
      createdAt: 0,
      isClosed: true,
      accruedInterest: 5e16,
    },
    {
      transactionId: 1,
      owner: '0x111',
      term: 30,
      loanAmount: 1e18,
      minCollateralRatio: 5e17,
      interestRate: 3e15,
      createdAt: 0,
      isClosed: false,
      accruedInterest: 5e16,
    },
  ];
};

export const withdrawCollateral = async (
  transactionId: string,
  amount: number,
): Promise<string> => {
  // TODO send to contract and get txid back
  return `Ox${Math.random()
    .toString()
    .replace(/\.*/g, '')}`;
};

export const addCollateral = async (transactionId: string, amount: number) => {
  // TODO send to contract and get txid back
  return `Ox${Math.random()
    .toString()
    .replace(/\.*/g, '')}`;
};

export const repay = async (transactionId: string, amount: number) => {
  // TODO send to contract and get txid back
  return `Ox${Math.random()
    .toString()
    .replace(/\.*/g, '')}`;
};
