import { getContracts, getContractEventFlow } from './Web3Service';
import { accountStore } from '../index';
import { BigNumber } from '../../utils/BigNumber';
import { EventData } from 'web3-eth-contract';

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
): Promise<EventData> => {
  const flow = await getContractEventFlow('LoanManager', 'LoanSuccessful', {
    filter: { user: accountStore.defaultAccount },
  });

  return flow(LoanManager =>
    LoanManager.methods
      .loan(
        term,
        loanTokenAddress,
        collateralTokenAddress,
        loanAmount.toString(),
        collateralAmount.toString(),
        requestedFreedCollateral.toString(),
      )
      .send({ from: accountStore.defaultAccount }),
  );
};

export const getLoanTransactions = async (): Promise<string[]> => {
  const { LoanManager } = await getContracts();

  return LoanManager.methods.getLoansByUser(accountStore.defaultAccount).call();
};

export const getFreedCollateral = async (tokenAddress: string) => {
  const { LoanManager } = await getContracts();

  return LoanManager.methods.getFreedCollateral(tokenAddress).call();
};

export const withdrawFreedCollateral = async (
  tokenAddress: string,
  amount: BigNumber,
) => {
  const flow = await getContractEventFlow(
    'LoanManager',
    'WithdrawFreeCollateralSuccessful',
    {
      filter: { user: accountStore.defaultAccount },
    },
  );

  return flow(LoanManager =>
    LoanManager.methods
      .withdrawFreedCollateral(tokenAddress, amount.toString())
      .send({ from: accountStore.defaultAccount }),
  );
};

export const addCollateral = async (
  loanAddress: string,
  amount: BigNumber,
  requestedFreedCollateral: BigNumber,
) => {
  const flow = await getContractEventFlow(
    'LoanManager',
    'AddCollateralSuccessful',
    {
      filter: { user: accountStore.defaultAccount },
    },
  );

  return flow(LoanManager =>
    LoanManager.methods
      .addCollateral(
        loanAddress,
        amount.toString(),
        requestedFreedCollateral.toString(),
      )
      .send({ from: accountStore.defaultAccount }),
  );
};

export const repayLoan = async (
  transactionAddress: string,
  amount: BigNumber,
) => {
  const flow = await getContractEventFlow(
    'LoanManager',
    'RepayLoanSuccessful',
    {
      filter: { user: accountStore.defaultAccount },
    },
  );

  return flow(LoanManager =>
    LoanManager.methods
      .repayLoan(transactionAddress, amount.toString())
      .send({ from: accountStore.defaultAccount }),
  );
};
