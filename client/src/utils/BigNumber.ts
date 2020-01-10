import BigNumber from 'bn.js';

export { BigNumber };

const significant = 18;

export const convertWeiToDecimal = (
  bn?: BigNumber | string,
  precision: number = 4,
) => {
  if (!bn) {
    return '0';
  }
  if (typeof bn === 'string') {
    bn = new BigNumber(bn);
  }
  const numberString = bn.toString();

  const padString = numberString.padStart(
    numberString.length + significant,
    '0',
  );

  const integerPlaces = Number.parseInt(
    padString.substring(0, padString.length - significant),
    10,
  ).toString();

  const decimalPlaces = padString.substring(
    padString.length - significant,
    padString.length,
  );

  return `${integerPlaces}.${decimalPlaces
    .substring(decimalPlaces.length - significant, decimalPlaces.length)
    .substring(0, precision)}`;
};

/**
 * Convert number to BigNumber with specified significant.
 * toFixedBN(100) -> 100e18
 * toFixedBN(1.5) -> 15e17
 * toFixed(0.03) -> 3e16
 * toFixed(5, 16) -> 5e16
 */
export const convertDecimalToWei = (num: number | string) => {
  if (!num) {
    return new BigNumber(0);
  }

  const fixedNumber = typeof num === 'number' ? num.toFixed(significant) : num;
  const decimalPlaces = (fixedNumber.split('.')[1] || '').replace(/0*$/, '')
    .length;

  if (decimalPlaces === 0) {
    return new BigNumber(num).mul(
      new BigNumber(10).pow(new BigNumber(significant)),
    );
  } else {
    const integer = fixedNumber.replace(/0*$/, '').replace('.', '');
    return new BigNumber(integer).mul(
      new BigNumber(10).pow(new BigNumber(significant - decimalPlaces)),
    );
  }
};

/**
 * format a bignumber.js instance to BN.js instance
 * @param bn bignumber.js instance
 */
export const formatBigNumber = (bn: BigNumber) =>
  convertDecimalToWei(convertWeiToDecimal(bn));

export const ZERO = new BigNumber(0);
