import { IGetAllPoolResponse } from '../services/PoolService/Pipes';
import { IDistributionFeeRatios } from '../stores';
import { convertWeiToDecimal } from './BigNumber';

export const calculateUtilizationByPoolData = (
  pool: IGetAllPoolResponse,
  distributionFeeRatios: IDistributionFeeRatios,
) => {
  return pool.depositAmount === '0'
    ? '0.00'
    : (
        (1 -
          Number.parseFloat(convertWeiToDecimal(pool.availableAmount)) /
            (Number.parseFloat(convertWeiToDecimal(pool.depositAmount)) +
              Number.parseFloat(convertWeiToDecimal(pool.loanInterest)) *
                (1 -
                  Number.parseFloat(
                    convertWeiToDecimal(
                      distributionFeeRatios.loanDistributorFeeRatio,
                    ),
                  )))) *
        100
      ).toFixed(2);
};
