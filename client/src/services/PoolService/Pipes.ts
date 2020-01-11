import { isAllEqual } from '../../utils/isAllEqual';
import { IPool } from '../../stores/PoolStore';

interface IGetAllPoolResponse {
  poolIdList: string[];
  depositAmountList: string[];
  availableAmountList: string[];
  loanInterestList: string[];
  totalDepositWeightList: string[];
}

export const PoolsPipe = (
  tokenAddress: string,
  {
    poolIdList,
    depositAmountList,
    availableAmountList,
    loanInterestList,
    totalDepositWeightList,
  }: IGetAllPoolResponse,
): IPool[] => {
  if (
    isAllEqual(
      poolIdList.length,
      depositAmountList.length,
      availableAmountList.length,
      loanInterestList.length,
      totalDepositWeightList.length,
    )
  ) {
    throw new Error('Client: Data length dose not match.');
  }

  return depositAmountList.map((depositAmount, index) => {
    const APR =
      totalDepositWeightList[index].toString() === '0'
        ? '0.00'
        : (
            (Number.parseFloat(loanInterestList[index]) /
              Number.parseFloat(totalDepositWeightList[index])) *
            100
          ).toFixed(2);

    const utilization =
      depositAmount.toString() === '0'
        ? '0.00'
        : (
            (Number.parseFloat(availableAmountList[index]) /
              Number.parseFloat(depositAmount[index])) *
            100
          ).toFixed(2);

    return {
      poolId: poolIdList[index],
      tokenAddress,
      term: index,
      APR,
      utilization,
      totalDeposit: depositAmount,
      availableAmount: availableAmountList[index],
      loanInterest: loanInterestList[index],
      totalDepositWeight: totalDepositWeightList[index],
    };
  });
};
