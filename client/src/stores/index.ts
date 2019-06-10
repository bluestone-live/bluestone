import { Account } from './models/AccountModel';
import { Configuration } from './models/ConfigurationModel';
import { TokenStore } from './models/TokenModel';

export const account = new Account();
export const configuration = new Configuration();
export const tokenStore = new TokenStore();

export const initStore = async () => {
  // TODO: get basic data
};

export * from './models/AccountModel';
export * from './models/ConfigurationModel';
export * from './models/TokenModel';
