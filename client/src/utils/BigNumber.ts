import BigNumber from 'bn.js';

export { BigNumber };

export const toFixed = (bn: BigNumber, fractionDigits: number) =>
  bn.toNumber().toFixed(fractionDigits);

export const convertWeiToDecimal = (bn: BigNumber) =>
  Number.parseFloat(bn.toString()) / 1e18;
