import { convertWeiToDecimal } from './BigNumber';

export const calcCollateralRatio = (
  collateralAmount: string,
  remainingDebt: string,
  collateralAssetPrice?: string,
  loanAssetPrice?: string,
) => {
  if (
    !Number.parseFloat(collateralAmount) ||
    !Number.parseFloat(remainingDebt) ||
    !loanAssetPrice ||
    !collateralAssetPrice
  ) {
    return '0.0000';
  }
  return (
    ((Number.parseFloat(collateralAmount) *
      Number.parseFloat(convertWeiToDecimal(collateralAssetPrice, 18))) /
      Number.parseFloat(convertWeiToDecimal(loanAssetPrice, 18)) /
      Number.parseFloat(remainingDebt)) *
    100
  ).toFixed(2);
};

export const calcCollateralAmount = (
  collateralRatio: string,
  remainingDebt: string,
  collateralAssetPrice?: string,
  loanAssetPrice?: string,
) => {
  if (
    !Number.parseFloat(collateralRatio) ||
    !Number.parseFloat(remainingDebt) ||
    !loanAssetPrice ||
    !collateralAssetPrice
  ) {
    return '0.00';
  }

  const value =
    ((Number.parseFloat(collateralRatio) / 100) *
      Number.parseFloat(remainingDebt) *
      Number.parseFloat(convertWeiToDecimal(loanAssetPrice, 18))) /
    Number.parseFloat(convertWeiToDecimal(collateralAssetPrice, 18));

  return value.toFixed(18);
};
