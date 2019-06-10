import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

const requireContract = (contractName: string) =>
  require(`../../../../build/contracts/${contractName}.json`);

export const contractJsonInterface = {
  // Deployed contracts (single-instance)
  Configuration: requireContract('Configuration'),
  LiquidityPools: requireContract('LiquidityPools'),
  TokenFactory: requireContract('TokenFactory'),
  DepositManager: requireContract('DepositManager'),
  LoanManager: requireContract('LoanManager'),

  // Non-deployed contracts (may have multiple-instances)
  PoolGroup: requireContract('PoolGroup'),
};

type ContractInstances = typeof contractJsonInterface;

// * export web3 for some special use
export let web3: Web3;
if ((global as any).ethereum) {
  web3 = new Web3((global as any).ethereum);
} else if ((global as any).web3) {
  web3 = new Web3((global as any).web3.currentProvider);
} else {
  // TODO alert "please install MetaMask first"
}

/**
 * create contract instance by JSON interface
 * @param contract: contract JSON interface
 */
const contractInstanceFactory = async (contract: any) => {
  const netId = await web3.eth.net.getId();
  return new web3.eth.Contract(
    contract.abi as AbiItem[],
    contract.networks[netId].address,
  );
};

let contractInstances: ContractInstances;

/**
 * get all declared contract instances
 * @returns Promise<ContractInstance>
 */
export const getContracts = async (): Promise<ContractInstances> => {
  if (contractInstances) {
    return contractInstances;
  }

  // build contract Instance by factory
  const pairs = await Promise.all(
    Object.keys(contractJsonInterface)
      .map(k => ({
        k,
        v: (contractJsonInterface as any)[k],
      }))
      .map(async ({ k, v }) => {
        const instance = await contractInstanceFactory(v);
        return {
          k,
          v: instance,
        };
      }),
  );

  // compose to an object
  contractInstances = pairs.reduce(
    (o, { k, v }) => ({
      ...o,
      [k]: v,
    }),
    contractJsonInterface,
  );

  return contractInstances;
};
