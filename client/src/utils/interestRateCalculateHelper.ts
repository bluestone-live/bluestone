import { convertWeiToDecimal, BigNumber } from './BigNumber';

// Estimate interest rate for a given period and return percentage
export const calculateRate = (ratePerSecond: BigNumber) => {
  if (!ratePerSecond) {
    return '0';
  }
  const bigNumberRate = new BigNumber(ratePerSecond.toString());

  return convertWeiToDecimal(bigNumberRate.mul(new BigNumber(100)), 2);
};
