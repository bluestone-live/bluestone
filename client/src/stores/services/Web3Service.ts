import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { EventData, Contract, EventOptions } from 'web3-eth-contract';
import { accountStore } from '..';
import { convertDecimalToWei } from '../../utils/BigNumber';
import { EventName } from '../../constants/Event';

const requireContract = (contractName: string) =>
  require(`../../../../build/contracts/${contractName}.json`);

// Single instance
const deployedContractJsonInterface = {
  Configuration: requireContract('Configuration'),
  LiquidityPools: requireContract('LiquidityPools'),
  DepositManager: requireContract('DepositManager'),
  LoanManager: requireContract('LoanManager'),
  TokenManager: requireContract('TokenManager'),
  PriceOracle: requireContract('PriceOracle'),
};

// May have multiple-instances
export const nonDeployedContractJsonInterface = {
  Deposit: requireContract('Deposit'),
  Loan: requireContract('Loan'),
  PoolGroup: requireContract('PoolGroup'),
  ERC20: requireContract('ERC20'),
  WrappedEther: requireContract('WrappedEther'),
};

type DeployedContractInstances = typeof deployedContractJsonInterface;

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
const deployedContractInstanceFactory = async (contract: any) => {
  const netId = await web3.eth.net.getId();
  const instance = new web3.eth.Contract(
    contract.abi as AbiItem[],
    contract.networks[netId].address,
  );
  return instance;
};

let deployedContractInstances: DeployedContractInstances;

const generateContractInstances = async (): Promise<
  DeployedContractInstances
> => {
  if (deployedContractInstances) {
    return deployedContractInstances;
  }

  // build contract Instance by factory
  const pairs = await Promise.all(
    Object.keys(deployedContractJsonInterface)
      .map(k => ({
        k,
        v: (deployedContractJsonInterface as any)[k],
      }))
      .map(async ({ k, v }) => {
        const instance = await deployedContractInstanceFactory(v);
        return {
          k,
          v: instance,
        };
      }),
  );

  // compose to an object
  deployedContractInstances = pairs.reduce(
    (o, { k, v }) => ({
      ...o,
      [k]: v,
    }),
    deployedContractJsonInterface,
  );

  return deployedContractInstances;
};

let getContractsPromise: Promise<DeployedContractInstances>;
/**
 * get all declared contract instances
 * @returns Promise<ContractInstance>
 */
export const getContracts = () => {
  if (!getContractsPromise) {
    getContractsPromise = generateContractInstances();
  }
  return getContractsPromise;
};

/**
 * Create a flow that could converts contract.method.send() to promise by pass a callback function
 *
 * usage:
 * ```
 * const flow = await getContractEventFlow('DepositManager', 'DepositSuccessful');
 *
 * return flow(DepositManager => {
 *   DepositManager.methods
 *     .deposit(assetAddress, term, amount.toString(), isRecurring)
 *     .send({ from: accountStore.defaultAccount });
 * });
 * ```
 */
export const getContractEventFlow = async (
  contract: keyof DeployedContractInstances | Contract,
  eventName: EventName,
  options?: EventOptions,
): Promise<
  (callback: (contract: Contract) => Promise<any>) => Promise<EventData>
> => {
  let contractInstance: Contract;
  if (typeof contract === 'string') {
    const contracts = await getContracts();
    contractInstance = contracts[contract];
  } else {
    contractInstance = contract;
  }

  let eventSubscription: any;
  const eventFlow = (callback: (contract: Contract) => Promise<any>) => {
    const p = new Promise<EventData>((resolve, reject) => {
      eventSubscription = contractInstance.events[eventName](
        options || {},
        (err: Error, data: EventData) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
          // 'once' method didn't unsubscribe after the event handler called. so we have to unsubscribe ourselves.
          eventSubscription.unsubscribe();
        },
      );
    });
    callback(contractInstance).catch(e => {
      // TODO format and show error message from contract here.
      // tslint:disable-next-line:no-console
      console.error(e);
      eventSubscription.unsubscribe();
    });
    return p;
  };

  return eventFlow;
};

export const getPassEvents = async (
  contract: keyof DeployedContractInstances | Contract,
  eventName: EventName,
  options?: EventOptions,
) => {
  let contractInstance: Contract;
  if (typeof contract === 'string') {
    const contracts = await getContracts();
    contractInstance = contracts[contract];
  } else {
    contractInstance = contract;
  }
  contractInstance.getPastEvents(
    eventName,
    options || {
      filter: {
        user: accountStore.defaultAccount,
        fromBlock: 0,
        toBlock: 'latest',
      },
    },
  );
};
