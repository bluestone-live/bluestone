import { BigNumber } from '../../utils/BigNumber';
import { IFreedCollateral } from '../../_stores';

interface IGetFreedCollateralResultSet {
  tokenAddressList: string[];
  freedCollateralAmountList: BigNumber[];
}

export const freedCollateralPipe = ({
  tokenAddressList,
  freedCollateralAmountList,
}: IGetFreedCollateralResultSet): IFreedCollateral[] =>
  tokenAddressList.map((tokenAddress, i) => ({
    tokenAddress,
    amount: freedCollateralAmountList[i],
  }));
