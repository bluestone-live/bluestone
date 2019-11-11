import { BigNumber } from '../../utils/BigNumber';
import { IAvailableCollateral } from '../../stores';

interface IGetAvailableCollateralResultSet {
  tokenAddressList: string[];
  availableCollateralAmountList: BigNumber[];
}

export const availableCollateralPipe = ({
  tokenAddressList,
  availableCollateralAmountList,
}: IGetAvailableCollateralResultSet): IAvailableCollateral[] =>
  tokenAddressList.map((tokenAddress, i) => ({
    tokenAddress,
    amount: availableCollateralAmountList[i],
  }));
