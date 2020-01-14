import { IPool } from '../../stores/PoolStore';

interface IGetAllPoolResponse {
  poolId: string;
  depositAmount: string;
  availableAmount: string;
  loanInterest: string;
  totalDepositWeight: string;
}

export const PoolsPipe = (
  tokenAddress: string,
  pools: IGetAllPoolResponse[],
): IPool[] => {
  return pools.map((pool, index) => {
    const APR =
      pool.totalDepositWeight === '0'
        ? '0.00'
        : (
            (Number.parseFloat(pool.loanInterest) /
              Number.parseFloat(pool.totalDepositWeight)) *
            100
          ).toFixed(2);

    const utilization =
      pool.depositAmount === '0'
        ? '0.00'
        : (
            ((Number.parseFloat(pool.depositAmount) -
              Number.parseFloat(pool.availableAmount)) /
              Number.parseFloat(pool.depositAmount)) *
            100
          ).toFixed(2);

    return {
      ...pool,
      tokenAddress,
      term: index + 1,
      APR,
      utilization,
      totalDeposit: pool.depositAmount,
    };
  });
};
