import { IDistributionFeeRatios } from '../stores';
import { convertWeiToDecimal } from './BigNumber';
import { IGetAllPoolResponse } from '../services/PoolService/Pipes';

export const calculateAPRByPoolData = (
  pool: IGetAllPoolResponse,
  distributionFeeRatios: IDistributionFeeRatios,
  protocolReserveRatio: string,
) => {
  return (
    ((Number.parseFloat(convertWeiToDecimal(pool.loanInterest)) *
      (1 -
        Number.parseFloat(
          convertWeiToDecimal(distributionFeeRatios.depositDistributorFeeRatio),
        ) -
        Number.parseFloat(
          convertWeiToDecimal(distributionFeeRatios.loanDistributorFeeRatio),
        ) -
        Number.parseFloat(convertWeiToDecimal(protocolReserveRatio)))) /
      Number.parseFloat(convertWeiToDecimal(pool.totalDepositWeight))) *
    365 *
    100
  ).toFixed(2);
};
