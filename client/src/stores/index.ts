import { Account } from './Account';
import { Configuration } from './Configuration.model';

export const account = new Account();
export const configuration = new Configuration();

export const initStore = async () => {
  // TODO: get basic data
};

export * from './Account';
export * from './Configuration.model';
