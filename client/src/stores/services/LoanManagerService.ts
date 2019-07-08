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
      loanAmount.toString(),
      collateralAmount.toString(),
      requestedFreedCollateral.toString(),
    )
    .send({ from: accountStore.defaultAccount });
};

export const getLoans = async (): Promise<IGetLoanTransactionResponse[]> => {
  const contracts = await getContracts();
  return contracts.LoanManager.methods
    .getLoansByUser(accountStore.defaultAccount)
    .call();
};

export const getFreedCollateral = async (
  tokenAddress: string,
): Promise<BigNumber> => {
  const contracts = await getContracts();
  return contracts.LoanManager.methods
    .getFreedCollateral(tokenAddress)
    .send({ from: accountStore.defaultAccount });
};

export const withdrawFreedCollateral = async (
  tokenAddress: string,
  amount: BigNumber,
): Promise<string> => {
  const contracts = await getContracts();
  return contracts.LoanManager.methods
    .withdrawFreedCollateral(tokenAddress, amount)
    .send({ from: accountStore.defaultAccount });
};

export const addCollateral = async (
  transactionAddress: string,
  amount: BigNumber,
) => {
  // TODO send to contract and get txid back
  return `Ox${Math.random()
    .toString()
    .replace(/\.*/g, '')}`;
};

export const repayLoan = async (
  loanTokenAddress: string,
  collateralAssetAddress: string,
  transactionAddress: string,
  amount: BigNumber,
) => {
  const contracts = await getContracts();
  return contracts.LoanManager.methods
    .repayLoan(
      loanTokenAddress,
      collateralAssetAddress,
      transactionAddress,
      amount,
    )
    .send({ from: accountStore.defaultAccount });
};
