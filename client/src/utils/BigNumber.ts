import BigNumber from 'bn.js';
import { utils } from 'ethers';

export { BigNumber };

export const convertWeiToDecimal = (
  bn?: BigNumber | string,
  precision: number = 4,
  decimals: number | string = 18,
) => {
  if (!bn) {
    return '0';
  }

  return Number.parseFloat(utils.formatUnits(`${bn}`, decimals)).toFixed(
    precision,
  );
};

/**
 * Convert number to big number string with specified significant.
 * toFixedBN(100) -> 100e18
 * toFixedBN(1.5) -> 15e17
 * toFixed(0.03) -> 3e16
 * toFixed(5, 16) -> 5e16
 */
export const convertDecimalToWei = (
  num: number | string,
  decimals: number | string = 18,
): string => {
  return utils.parseUnits(`${num || 0}`, decimals).toString();
};

export const ZERO = new BigNumber(0);
