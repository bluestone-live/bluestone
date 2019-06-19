import { AccountStore } from './AccountStore';
import { ConfigurationStore } from './ConfigurationStore';
import { TokenStore } from './TokenStore';
import { LiquidityPoolsStore } from './LiquidityPoolsStore';
import { TransactionStore } from './TransactionStore';
import { LoanManagerStore } from './LoanManagerStore';

export const accountStore = new AccountStore();
export const configurationStore = new ConfigurationStore();
export const tokenStore = new TokenStore();
export const liquidityPoolsStore = new LiquidityPoolsStore();
export const transactionStore = new TransactionStore();
export const loanManagerStore = new LoanManagerStore();

export const initStore = async () => {
  await tokenStore.initTokens();
  await loanManagerStore.init();
};

export * from './AccountStore';
export * from './ConfigurationStore';
export * from './TokenStore';
export * from './LiquidityPoolsStore';
export * from './TransactionStore';
export * from './LoanManagerStore';
