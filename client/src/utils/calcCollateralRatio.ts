import { convertWeiToDecimal, BigNumber } from './BigNumber';

export const calcCollateralRatio = (
  collateralAmount: string,
  remainingDebt: string,
  collateralAssetPrice?: BigNumber,
  loanAssetPrice?: BigNumber,
) => {
  if (
    !Number.parseFloat(collateralAmount) ||
    !Number.parseFloat(remainingDebt) ||
    !loanAssetPrice ||
    !collateralAssetPrice
  ) {
    return '-.--';
  }
  return (
    ((Number.parseFloat(collateralAmount) *
      Number.parseFloat(convertWeiToDecimal(collateralAssetPrice, 18))) /
      Number.parseFloat(convertWeiToDecimal(loanAssetPrice, 18)) /
      Number.parseFloat(remainingDebt)) *
    100
  ).toFixed(2);
};
