import { convertWeiToDecimal, BigNumber } from './BigNumber';

export enum RatePeriod {
  Annual,
}

// Estimate interest rate for a given period and return percentage
export const calculateRate = (ratePerSecond: BigNumber, period: RatePeriod) => {
  if (!ratePerSecond) {
    return '0';
  }
  const bigNumberRate = new BigNumber(ratePerSecond.toString());

  switch (period) {
    case RatePeriod.Annual:
      return convertWeiToDecimal(bigNumberRate.mul(new BigNumber(100)), 2);
    default:
      return convertWeiToDecimal(bigNumberRate.mul(new BigNumber(100)), 2);
  }
};
