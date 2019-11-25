import { BigNumber } from '../../utils/BigNumber';
import { isAllEqual } from '../../utils/isAllEqual';
import { IPool } from '../../stores/PoolStore';

interface IGetAllPoolResponse {
  depositAmountList: BigNumber[];
  availableAmountList: BigNumber[];
  loanInterestList: BigNumber[];
  totalDepositWeightList: BigNumber[];
}

export const PoolsPipe = ({
  depositAmountList,
  availableAmountList,
  loanInterestList,
  totalDepositWeightList,
}: IGetAllPoolResponse): IPool[] => {
  if (
    isAllEqual(
      depositAmountList.length,
      availableAmountList.length,
      loanInterestList.length,
      totalDepositWeightList.length,
    )
  ) {
    throw new Error('Client: Data length dose not match.');
  }

  return depositAmountList.map((depositAmount, index) => ({
    poolIndex: index,
    depositAmount,
    availableAmount: availableAmountList[index],
    loanInterest: loanInterestList[index],
    totalDepositWeight: totalDepositWeightList[index],
  }));
};
