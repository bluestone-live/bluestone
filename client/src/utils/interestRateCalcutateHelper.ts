import { convertWeiToDecimal } from './BigNumber';

export enum RatePeriod {
  Annual,
  Monthly,
  Weekly,
  Daily,
}

export const calculateRate = (rate: any, period: RatePeriod) => {
  // TODO: Not sure it is correct
  const bn1 = convertWeiToDecimal(rate);
  switch (period) {
    case RatePeriod.Annual:
      return bn1 * 21000000;
    case RatePeriod.Monthly:
      return bn1 * 180000;
    case RatePeriod.Weekly:
      return bn1 * 42000;
    case RatePeriod.Daily:
      return bn1 * 6000;
    default:
      return bn1;
  }
};
