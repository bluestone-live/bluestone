import { AccountStore } from './AccountStore';
import { ConfigurationStore } from './ConfigurationStore';
import { TokenStore } from './TokenStore';
import { LiquidityPoolsStore } from './LiquidityPoolsStore';

export const accountStore = new AccountStore();
export const configurationStore = new ConfigurationStore();
export const tokenStore = new TokenStore();
export const liquidityPoolsStore = new LiquidityPoolsStore();

export const initStore = async () => {
  // TODO: get basic data
};

export * from './AccountStore';
export * from './ConfigurationStore';
export * from './TokenStore';
export * from './LiquidityPoolsStore';
