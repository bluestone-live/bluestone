import { observable, action, computed } from 'mobx';
import { getAccounts } from './services/Account.service';

export class Account {
  @observable accounts: string[] = [];

  @action.bound
  async setAccounts(accounts: string[]) {
    this.accounts = accounts;
  }

  @action.bound
  async getAccounts() {
    const accounts = await getAccounts();
    if (accounts) {
      return this.setAccounts(accounts);
    }
  }

  @computed get defaultAccount() {
    if (this.accounts.length === 0) {
      return undefined;
    }
    return this.accounts[0];
  }
}
