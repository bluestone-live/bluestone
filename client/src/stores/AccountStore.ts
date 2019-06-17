import { observable, action, computed } from 'mobx';
import {
  getAccounts,
  connectToMetaMask,
  setMetaMaskConnected,
  isMetaMaskConnected,
} from './services/AccountService';
import { onAccountsChanged } from './services/EthereumService';

export class AccountStore {
  @observable accounts: string[] = [];

  @observable defaultAccountChanged: boolean = false;

  @action.bound
  async setAccounts(accounts: string[]) {
    // won't be connect next time if accounts is empty
    setMetaMaskConnected(accounts.length !== 0);
    this.accounts = accounts;
  }

  @action.bound
  isMetaMaskConnected() {
    return isMetaMaskConnected();
  }

  @action.bound
  connectToMetaMask() {
    return connectToMetaMask();
  }

  @action.bound
  async getAccounts() {
    const accounts = await getAccounts();
    if (accounts.length > 0) {
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
