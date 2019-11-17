import { convertWeiToDecimal, BigNumber } from './BigNumber';

// Estimate interest rate for a given period and return percentage
export const calculateRate = (annulPercentageRate?: BigNumber) => {
  if (!annulPercentageRate) {
    return '0';
  }
  const bigNumberRate = new BigNumber(annulPercentageRate.toString());

  return convertWeiToDecimal(bigNumberRate.mul(new BigNumber(100)), 2);
};
