import { IPool, IInterestRate, IToken } from '../stores';
import { convertWeiToDecimal } from './BigNumber';

export const composePools = (
  selectedPools: IPool[],
  interestRates: IInterestRate[],
  tokens: IToken[],
) => {
  return (selectedPools || []).map((pool, i, array) => ({
    poolId: pool.poolId,
    term: pool.term,
    availableAmount:
      parseFloat(
        convertWeiToDecimal(
          pool.availableAmount,
          4,
          tokens.find(t => t.tokenAddress === pool.tokenAddress)!.decimals,
        ),
      ) +
      array
        .slice(i + 1, array.length)
        .reduce(
          (sum, p) =>
            sum +
            parseFloat(
              convertWeiToDecimal(
                p.availableAmount,
                4,
                tokens.find(t => t.tokenAddress === p.tokenAddress)!.decimals,
              ),
            ),
          0,
        ),
    loanInterestRate: Number.parseFloat(
      (
        interestRates.find(interestRate => {
          return interestRate.term === pool.term;
        }) || { interestRate: '0' }
      ).interestRate,
    ),
  }));
};
