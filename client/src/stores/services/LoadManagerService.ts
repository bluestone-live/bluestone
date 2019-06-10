import { getContracts } from './Web3Service';

export const LoanManagerService = {
  async checkTokenLoanPairEnabled(
    loanTokenAddress: string,
    collateralAssetAddress: string,
  ) {
    const contract = await getContracts();
    return contract.LoanManager.methods
      .isLoanAssetPairEnabled(loanTokenAddress, collateralAssetAddress)
      .call();
  },
};
