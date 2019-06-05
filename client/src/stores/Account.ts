import { observable, action, computed } from 'mobx';
import { getAccounts } from './services/Account.service';
import { onAccountsChanged } from './services/Ethereum.service';

export class Account {
  @observable accounts: string[] = [];

  @observable defaultAccountChanged: boolean = false;

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

  @action.bound
  async checkAccounts({ selectedAddress }: { selectedAddress?: string }) {
    if (!selectedAddress) {
      return this.setAccounts([]);
    }
    const accounts = await getAccounts();
    if (!accounts) {
      return this.setAccounts([]);
    }
    if (accounts[0] !== this.defaultAccount) {
      return this.changeAccounts(accounts);
    }
  }

  @action.bound
  bindOnUpdateEvent() {
    onAccountsChanged(this.checkAccounts);
  }

  @action.bound
  changeAccounts(accounts: string[]) {
    this.accounts = accounts;
  }
}
