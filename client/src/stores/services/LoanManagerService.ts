import { getContracts } from './Web3Service';
import { BigNumber } from '../../utils/BigNumber';

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
  requestedFreedCollateral: BigNumber = 0,
) => {
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
    .call();
};
