import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { Contract, EventOptions, EventData } from 'web3-eth-contract';
import protocolDeclareFile from '../contracts/Protocol.json';
import ERC20 from '../contracts/ERC20Mock.json';
import interestModelDeclareFile from '../contracts/InterestModel.json';

interface ITokenDeclaration {
  name: string;
  symbol: string;
  address: string;
}

interface INetworkFile {
  contracts: { [key: string]: string };
  tokens: { [key: string]: ITokenDeclaration };
}

export enum EventName {
  LoanSucceed = 'LoanSucceed',
  RepayLoanSucceed = 'RepayLoanSucceed',
  AddCollateralSucceed = 'AddCollateralSucceed',
  SubtractCollateralSucceed = 'SubtractCollateralSucceed',
  DepositSucceed = 'DepositSucceed',
  WithdrawSucceed = 'WithdrawSucceed',
  EarlyWithdrawSucceed = 'EarlyWithdrawSucceed',
  LiquidateLoanSucceed = 'LiquidateLoanSucceed',
  Approval = 'Approval',
}

export type ERC20Factory = (tokenAddress: string) => Contract;

export type EventFlowFactory = (
  eventName: EventName,
  options?: EventOptions,
  contractInstance?: Contract,
) => Promise<
  (callback: (contract: Contract) => Promise<any>) => Promise<EventData>
>;

/**
 * Provider implementation
 */
export class MetaMaskProvider {
  private web3Instance?: Web3;
  private protocolInstance?: Contract;
  private interestModelInstance?: Contract;
  private eventBound: boolean = false;
  private protocolAddress?: string;
  private networkType?: string;

  /**
   * Init protocolInstance by global Web3 provider and network configs
   */
  async init() {
    if ((window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      // This property to be removed in the future
      if (ethereum.autoRefreshOnNetworkChange) {
        /*
         * stopped the meta mask warning:
         * https://metamask.github.io/metamask-docs/API_Reference/Ethereum_Provider#ethereum.autorefreshonnetworkchange
         */
        ethereum.autoRefreshOnNetworkChange = false;
      }
      this.web3Instance = new Web3(ethereum);
    } else if ((window as any).web3) {
      this.web3Instance = new Web3((window as any).web3.currentProvider);
    } else {
      throw new Error(
        'MetaMaskProvider init error: Require global web3 provider.',
      );
    }

    const networkId = await this.web3Instance.eth.net.getId();

    switch (networkId) {
      case 1:
        this.networkType = 'main';
        break;
      case 3:
        this.networkType = 'ropsten';
        break;
      case 42:
        this.networkType = 'kovan';
        break;
      case 4:
        this.networkType = 'rinkeby';
        break;
      case 5:
        this.networkType = 'goerli';
        break;
      default:
        this.networkType = 'private';
    }

    const networkFile = await this.getNetworkFile(this.networkType);

    this.protocolAddress =
      networkFile.contracts[protocolDeclareFile.contractName];

    this.protocolInstance = new this.web3Instance.eth.Contract(
      protocolDeclareFile.abi as AbiItem[],
      this.protocolAddress,
    );

    this.interestModelInstance = new this.web3Instance.eth.Contract(
      interestModelDeclareFile.abi as AbiItem[],
      networkFile.contracts[interestModelDeclareFile.contractName],
    );
  }

  async enableEthereumNetwork() {
    return (window as any).ethereum.enable();
  }

  async bindEthereumStateChangeEvent(
    onAccountChanged: (...args: any[]) => any,
  ) {
    if ((window as any).ethereum && !this.eventBound) {
      (window as any).ethereum.on('accountsChanged', onAccountChanged);
      this.eventBound = true;
    }
  }

  private async getNetworkFile(networkType: string): Promise<INetworkFile> {
    // Map web3 network type to that in network.json
    const currentNetwork =
      networkType === 'private' ? 'development' : networkType;
    return import(`../../../networks/${currentNetwork}.json`);
  }

  get protocol() {
    if (!this.protocolInstance) {
      throw new Error('MetaMaskProvider: Init failed');
    }
    return this.protocolInstance;
  }

  get interestModel() {
    if (!this.interestModelInstance) {
      throw new Error('MetaMaskProvider: Init failed');
    }
    return this.interestModelInstance;
  }

  get protocolContractAddress() {
    if (!this.protocolAddress) {
      throw new Error('MetaMaskProvider: Init failed');
    }
    return this.protocolAddress;
  }

  get web3() {
    if (!this.web3Instance) {
      throw new Error('MetaMaskProvider: Init failed');
    }
    return this.web3Instance;
  }

  get network() {
    if (!this.networkType) {
      throw new Error('MetaMaskProvider: Init failed');
    }
    return this.networkType;
  }

  getERC20ByTokenAddress: ERC20Factory = (tokenAddress: string) => {
    // TODO ZhangRGK: we may need to use their own abi file for each token
    return new this.web3.eth.Contract(ERC20.abi as AbiItem[], tokenAddress);
  };

  getTimestampByBlockHash = async (
    blockHash: string,
  ): Promise<string | number> =>
    (await this.web3.eth.getBlock(blockHash)).timestamp;

  /**
   * Create a flow that could converts contract.method.send() to promise by pass a callback function
   *
   * usage:
   * ```
   * const flow = await getContractEventFlow('DepositManager', 'DepositSuccessful');
   *
   * return flow(DepositManager => {
   *   DepositManager.methods
   *     .deposit(assetAddress, term, amount.toString())
   *     .send({ from: accountStore.defaultAccount });
   * });
   * ```
   */
  getContractEventFlow: EventFlowFactory = async (
    eventName: EventName,
    options?: EventOptions,
    contractInstance: Contract = this.protocol,
  ) => {
    let eventSubscription: any;
    const eventFlow = (
      callback: (callbackContractParam: Contract) => Promise<any>,
    ) => {
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
            try {
              eventSubscription.unsubscribe();
            } catch (_) {
              // Ignore the Unsubscribe Error
            }
          },
        );
        callback(contractInstance).catch(e => {
          // TODO format and show error message from contract here.
          // if (e.stack.indexOf('User denied transaction signature') >= 0) {
          //   Message.error(i18n.t('user_denied'));
          // } else {
          //   Message.error(e.message);
          // }
          reject(e);
        });
      });
      return p;
    };

    return eventFlow;
  };

  getPastEvents = async (
    accountAddress: string,
    eventName: EventName,
  ): Promise<EventData[]> => {
    return this.protocol.getPastEvents(eventName, {
      filter: {
        user: accountAddress,
      },
      fromBlock: 0,
      toBlock: 'latest',
    });
  };
}
