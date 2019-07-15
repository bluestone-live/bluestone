import { convertWeiToDecimal } from './BigNumber';

export enum RatePeriod {
  Annual,
}

// Estimate interest rate for a given period and return percentage
export const calculateRate = (ratePerSecond: any, period: RatePeriod) => {
  const decimalRate = convertWeiToDecimal(ratePerSecond);

  switch (period) {
    case RatePeriod.Annual:
      const yearInSeconds = 31536000;
      return decimalRate * yearInSeconds * 100;
    default:
      return decimalRate * 100;
  }
};
