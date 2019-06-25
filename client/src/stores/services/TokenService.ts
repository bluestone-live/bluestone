import {
  getContracts,
  nonDeployedContractJsonInterface,
  web3,
} from './Web3Service';

// TODO: get token address based on network. Currently only for testing.
export const getTokenAddress = async (tokenSymbol: string) => {
  const contracts = await getContracts();
  const tokenAddress = contracts.TokenFactory.methods
    .getToken(tokenSymbol)
    .call();
  return tokenAddress;
};

export const getERC20Token = async (tokenAddress: string) => {
  return new web3.eth.Contract(
    nonDeployedContractJsonInterface.ERC20.abi,
    tokenAddress,
  );
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
