import { enableLogging } from 'mobx-logger';
import { AccountStore } from './AccountStore';
import { ConfigurationStore } from './ConfigurationStore';
import { TokenStore } from './TokenStore';
import { LiquidityPoolsStore } from './LiquidityPoolsStore';
import { TransactionStore } from './TransactionStore';
import { LoanManagerStore } from './LoanManagerStore';
import { TokenManagerStore } from './TokenManagerStore';
import { ActionLogStore } from './ActionLogStore';
import { WethStore } from './WethStore';

export const accountStore = new AccountStore();
export const configurationStore = new ConfigurationStore();
export const tokenStore = new TokenStore();
export const liquidityPoolsStore = new LiquidityPoolsStore();
export const transactionStore = new TransactionStore();
export const loanManagerStore = new LoanManagerStore();
export const tokenManagerStore = new TokenManagerStore();
export const actionLogStore = new ActionLogStore();
export const wethStore = new WethStore();

export const initStore = async () => {
  const tokens = await tokenStore.initTokens();
  await loanManagerStore.init();
  await tokenManagerStore.init();
  await Promise.all(
    tokens.map(token => accountStore.getFreedCollateral(token)),
  );
};

// enableLogging({
//   action: true,
//   reaction: true,
//   transaction: true,
//   compute: true,
// });

export * from './AccountStore';
export * from './ConfigurationStore';
export * from './TokenStore';
export * from './LiquidityPoolsStore';
export * from './TransactionStore';
export * from './LoanManagerStore';
export * from './TokenManagerStore';
export * from './ActionLogStore';
export * from './WethStore';
