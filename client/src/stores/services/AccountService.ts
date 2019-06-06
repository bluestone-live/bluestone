import { web3 } from './Web3Service';

export const getAccounts = async () => {
  if (!web3.eth.defaultAccount) {
    try {
      await (global as any).ethereum.enable();
    } catch (e) {
      // TODO: notify user that they canceled the authorization
      return;
    }
  }
  return web3.eth.getAccounts();
};

export const getCoinBase = async () => web3.eth.getCoinbase();
