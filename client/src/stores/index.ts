import { AccountStore } from './AccountStore';
import { ConfigurationStore } from './ConfigurationStore';
import { TokenStore } from './TokenStore';
import { LiquidityPoolsStore } from './LiquidityPoolsStore';
import { TransactionStore } from './TransactionStore';

export const accountStore = new AccountStore();
export const configurationStore = new ConfigurationStore();
export const tokenStore = new TokenStore();
export const liquidityPoolsStore = new LiquidityPoolsStore();
export const transactionStore = new TransactionStore();

export const initStore = async () => {
  // TODO: get basic data
  await tokenStore.initTokens();
};

export * from './AccountStore';
export * from './ConfigurationStore';
export * from './TokenStore';
export * from './LiquidityPoolsStore';
export * from './TransactionStore';
