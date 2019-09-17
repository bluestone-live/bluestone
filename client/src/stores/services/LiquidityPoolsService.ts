import {
  getContracts,
  nonDeployedContractJsonInterface,
  web3,
} from './Web3Service';
import { BigNumber } from '../../utils/BigNumber';

export const getPoolGroup = async (tokenAddress: string, term: BigNumber) => {
  const { LiquidityPools } = await getContracts();

  const poolGroupAddress = await LiquidityPools.methods
    .poolGroups(tokenAddress, term.toString())
    .call();

  // TODO(zhangrgk): pool group address is null.

  return new web3.eth.Contract(
    nonDeployedContractJsonInterface.PoolGroup.abi,
    poolGroupAddress,
  );
};
