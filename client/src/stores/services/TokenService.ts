import { nonDeployedContractJsonInterface, web3 } from './Web3Service';
import { accountStore } from '..';
import networkConfig from '../../../../network.json';
import { BigNumber } from '../../utils/BigNumber';

export const getTokenAddress = async (tokenSymbol: string) => {
  const networkType = await web3.eth.net.getNetworkType();
  let currNetwork;

  // Map web3 network type to that in network.json
  switch (networkType) {
    case 'private':
      currNetwork = 'development';
      break;
    default:
      currNetwork = networkType;
  }

  const network = networkConfig[currNetwork];

  if (!network) {
    return null;
  } else {
    return network.tokens[tokenSymbol].address;
  }
};

export const getERC20Token = async (tokenAddress: string) => {
  return new web3.eth.Contract(
    nonDeployedContractJsonInterface.ERC20.abi,
    tokenAddress,
  );
};

export const getWrappedEther = async () => {
  const tokenAddress = await getTokenAddress('WETH');

  return new web3.eth.Contract(
    nonDeployedContractJsonInterface.WrappedEther.abi,
    tokenAddress,
  );
};

export const wrap = async (amount: BigNumber) => {
  const wrappedEther = await getWrappedEther();
  return wrappedEther.methods.deposit().send({
    from: accountStore.defaultAccount,
    value: amount.toString(),
  });
};

export const unwrap = async (amount: BigNumber) => {
  const wrappedEther = await getWrappedEther();
  return wrappedEther.methods.withdraw(amount.toString()).send({
    from: accountStore.defaultAccount,
  });
};

// TODO: does not work yet
// https://metamask.github.io/metamask-docs/Best_Practices/Registering_Your_Token
export const registerToken = async (tokenSymbol: string) => {
  return new Promise((resolve, reject) => {
    (global as any).ethereum.sendAsync(
      {
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: getTokenAddress(tokenSymbol),
            symbol: tokenSymbol,
            decimals: 18,
            image: 'http://placekitten.com/200/300',
          },
        },
        id: Math.round(Math.random() * 100000),
      },
      (err: any, added: any) => {
        if (err) {
          reject(err);
        } else if (added.error) {
          reject(added.error);
        } else {
          resolve(added);
        }
      },
    );
  });
};
