import { IDistributionFeeRatios } from '../stores';
import { convertWeiToDecimal } from './BigNumber';
import { IGetAllPoolResponse } from '../services/PoolService/Pipes';

export const calculateAPRByPoolData = (
  pool: IGetAllPoolResponse,
  distributionFeeRatios: IDistributionFeeRatios,
  protocolReserveRatio: string,
) => {
  return (
    ((Number.parseFloat(convertWeiToDecimal(pool.loanInterest, 18)) *
      (1 -
        Number.parseFloat(
          convertWeiToDecimal(
            distributionFeeRatios.depositDistributorFeeRatio,
            18,
          ),
        ) -
        Number.parseFloat(
          convertWeiToDecimal(
            distributionFeeRatios.loanDistributorFeeRatio,
            18,
          ),
        ) -
        Number.parseFloat(convertWeiToDecimal(protocolReserveRatio, 18)))) /
      Number.parseFloat(convertWeiToDecimal(pool.totalDepositWeight, 18))) *
    365 *
    100
  ).toFixed(2);
};
