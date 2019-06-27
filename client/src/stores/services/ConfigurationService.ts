import { getContracts } from './Web3Service';
import { BigNumber } from '../../utils/BigNumber';

export const getProfitRatio = async () => {
  const contract = await getContracts();
  return contract.Configuration.methods.getProfitRatio().call();
};

export const getLoanInterestRate = async (
  tokenAddress: string,
  term: number,
): Promise<BigNumber> => {
  const contract = await getContracts();
  return contract.Configuration.methods
    .getLoanInterestRate(tokenAddress, term)
    .call();
};

export const getCollateralRatio = async (
  loanTokenAddress: string,
  collateralTokenAddress: string,
) => {
  const contract = await getContracts();
  return contract.Configuration.methods
    .getCollateralRatio(loanTokenAddress, collateralTokenAddress)
    .call();
};
