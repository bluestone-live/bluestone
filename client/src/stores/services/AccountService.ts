import { web3 } from './Web3Service';
import localforage from 'localforage';

export const getAccounts = async () => web3.eth.getAccounts();

export const connectToMetaMask = async () => (global as any).ethereum.enable();

export const isMetaMaskConnected = () =>
  localforage.getItem<boolean>('bluestone_connected');

export const setMetaMaskConnected = (hasConnected: boolean = true) =>
  localforage.setItem('bluestone_connected', hasConnected);

export const getCoinBase = async () => web3.eth.getCoinbase();
