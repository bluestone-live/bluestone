import { IPool } from '../../stores/PoolStore';
import { calculateAPRByPoolData } from '../../utils/calculateAPRByPoolData';
import { IDistributionFeeRatios } from '../../stores';
import { calculateUtilizationByPoolData } from '../../utils/calculateUtilizationByPoolData';

export interface IGetAllPoolResponse {
  poolId: string;
  depositAmount: string;
  availableAmount: string;
  loanInterest: string;
  totalDepositWeight: string;
}

export interface IGetPoolByIdResponse {
  depositAmount: string;
  availableAmount: string;
  loanInterest: string;
  totalDepositWeight: string;
  depositDistributorFeeRatio: string;
  loanDistributorFeeRatio: string;
  protocolReserveRatio: string;
}

export const PoolsPipe = (
  tokenAddress: string,
  pools: IGetAllPoolResponse[],
  distributionFeeRatios: IDistributionFeeRatios,
  protocolReserveRatio: string,
): IPool[] => {
  return pools.map((pool, index) => {
    const APR =
      pool.totalDepositWeight === '0'
        ? '0.00'
        : calculateAPRByPoolData(
            pool,
            distributionFeeRatios,
            protocolReserveRatio,
          );

    const utilization = calculateUtilizationByPoolData(
      pool,
      distributionFeeRatios,
    );

    return {
      ...pool,
      tokenAddress,
      term: index,
      APR,
      utilization,
      totalDeposit: pool.depositAmount,
    };
  });
};

export const hideFirstPoolPipe = (pools: IPool[]) =>
  pools.slice(1, pools.length);

export const PoolPipe = (
  tokenAddress: string,
  poolId: string,
  pool: IGetPoolByIdResponse,
): IPool => {
  const APR =
    pool.totalDepositWeight === '0'
      ? '0.00'
      : calculateAPRByPoolData(
          { ...pool, poolId },
          {
            depositDistributorFeeRatio: pool.depositDistributorFeeRatio,
            loanDistributorFeeRatio: pool.loanDistributorFeeRatio,
          },
          pool.protocolReserveRatio,
        );

  const utilization = calculateUtilizationByPoolData(
    { ...pool, poolId },
    {
      depositDistributorFeeRatio: pool.depositDistributorFeeRatio,
      loanDistributorFeeRatio: pool.loanDistributorFeeRatio,
    },
  );

  return {
    poolId,
    tokenAddress,
    term: 0,
    APR,
    utilization,
    totalDeposit: pool.depositAmount,
    ...pool,
  };
};
