import { Account } from './models/AccountModel';
import { Configuration } from './models/ConfigurationModel';

export const account = new Account();
export const configuration = new Configuration();

export const initStore = async () => {
  // TODO: get basic data
};

export * from './models/AccountModel';
export * from './models/ConfigurationModel';
