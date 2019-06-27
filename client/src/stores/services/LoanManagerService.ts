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
  loanTokenAddress: string,
  collateralTokenAddress: string,
  loanAmount: BigNumber,
  collateralAmount: BigNumber,
  requestedFreedCollateral: BigNumber = new BigNumber(0),
): Promise<object> => {
  const contracts = await getContracts();
  return contracts.LoanManager.methods
    .loan(
      term,
      loanTokenAddress,
      collateralTokenAddress,
      loanAmount,
      collateralAmount,
      requestedFreedCollateral,
    )
    .send({ from: accountStore.defaultAccount });
};

export const getLoanTransactions = async (
  loanTokenAddress: string,
  collateralTokenAddress: string,
): Promise<IGetLoanTransactionResponse[]> => {
  // TODO: use real data instead
  return [
    {
      transactionId: '1',
      owner: '0x111',
      term: 7,
      loanAmount: 1e18,
      minCollateralRatio: 5e17,
      interestRate: 3e15,
      createdAt: 0,
      isClosed: true,
      accruedInterest: 5e16,
      collateralAmount: 1e19,
    },
    {
      transactionId: '1',
      owner: '0x111',
      term: 30,
      loanAmount: 1e18,
      minCollateralRatio: 5e17,
      interestRate: 3e15,
      createdAt: 0,
      isClosed: false,
      accruedInterest: 5e16,
      collateralAmount: 1e19,
    },
  ];
};

export const getLoanTransactionById = async (
  transactionId: string,
): Promise<IGetLoanTransactionResponse> => {
  return {
    transactionId,
    owner: '0x111',
    term: 30,
    loanAmount: 1e18,
    minCollateralRatio: 5e17,
    interestRate: 3e15,
    createdAt: 0,
    isClosed: false,
    accruedInterest: 5e16,
    collateralAmount: 1e19,
    loanToken: 'ETH',
    collateralToken: 'DAI',
  };
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
