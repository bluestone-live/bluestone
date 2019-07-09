import { BigNumber } from './BigNumber';

export const formatSolidityTime = (originalTime: BigNumber) =>
  Number.parseInt(originalTime.toString(), 10) * 1000;
