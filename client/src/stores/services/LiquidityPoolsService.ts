import {
  getContracts,
  nonDeployedContractJsonInterface,
  web3,
} from './Web3Service';

export const getPoolGroup = async (tokenAddress: string, term: number) => {
  const { LiquidityPools } = await getContracts();
  const poolGroupAddress = await LiquidityPools.methods
    .poolGroups(tokenAddress, term)
    .call();

  return new web3.eth.Contract(
    nonDeployedContractJsonInterface.PoolGroup.abi,
    poolGroupAddress,
  );
};
