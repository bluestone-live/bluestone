import BigNumber from 'bn.js';

export { BigNumber };

export const convertWeiToDecimal = (bn: BigNumber) =>
  Number.parseFloat(bn.toString()) / 1e18;

/**
 * Convert number to BigNumber with specified significant.
 * toFixedBN(100) -> 100e18
 * toFixedBN(1.5) -> 15e17
 * toFixed(0.03) -> 3e16
 * toFixed(5, 16) -> 5e16
 */
export const convertDecimalToWei = (num: number, significant: number = 18) => {
  const decimalPlaces = (num.toString().split('.')[1] || []).length;

  if (decimalPlaces === 0) {
    return new BigNumber(num).mul(
      new BigNumber(10).pow(new BigNumber(significant)),
    );
  } else {
    const integer = num * Math.pow(10, decimalPlaces);
    return new BigNumber(integer).mul(
      new BigNumber(10).pow(new BigNumber(significant - decimalPlaces)),
    );
  }
};
