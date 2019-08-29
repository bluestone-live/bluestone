import { getContracts, getContractEventFlow } from './Web3Service';
import { accountStore } from '../index';
import { BigNumber } from '../../utils/BigNumber';
import { EventData } from 'web3-eth-contract';
import { EventName } from '../../constants/Event';

export const getLoanTerms = async (): Promise<BigNumber[]> => {
  const contract = await getContracts();
  return contract.LoanManager.methods.getLoanTerms().call();
};

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
  term: BigNumber,
  loanTokenAddress: string,
  collateralTokenAddress: string,
  loanAmount: BigNumber,
  collateralAmount: BigNumber,
  useFreedCollateral: boolean = false,
): Promise<EventData> => {
  const flow = await getContractEventFlow(
    'LoanManager',
    EventName.LoanSuccessful,
    {
      filter: { user: accountStore.defaultAccount },
    },
  );

  return flow(LoanManager =>
    LoanManager.methods
      .loan(
        term.toString(),
        loanTokenAddress,
        collateralTokenAddress,
        loanAmount.toString(),
        collateralAmount.toString(),
        useFreedCollateral,
      )
      .send({ from: accountStore.defaultAccount }),
  );
};

export const getLoanRecords = async (): Promise<string[]> => {
  const { LoanManager } = await getContracts();

  return LoanManager.methods.getLoansByUser(accountStore.defaultAccount).call();
};

export const addCollateral = async (
  loanAddress: string,
  amount: BigNumber,
  useFreedCollateral: boolean,
) => {
  const flow = await getContractEventFlow(
    'LoanManager',
    EventName.AddCollateralSuccessful,
    {
      filter: { user: accountStore.defaultAccount },
    },
  );

  return flow(LoanManager =>
    LoanManager.methods
      .addCollateral(loanAddress, amount.toString(), useFreedCollateral)
      .send({ from: accountStore.defaultAccount }),
  );
};

export const repayLoan = async (recordAddress: string, amount: BigNumber) => {
  const flow = await getContractEventFlow(
    'LoanManager',
    EventName.RepayLoanSuccessful,
    {
      filter: { user: accountStore.defaultAccount },
    },
  );

  return flow(LoanManager =>
    LoanManager.methods
      .repayLoan(recordAddress, amount.toString())
      .send({ from: accountStore.defaultAccount }),
  );
};
