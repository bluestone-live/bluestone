import { observable, action, computed } from 'mobx';
import {
  getAccounts,
  connectToMetaMask,
  setMetaMaskConnected,
  isMetaMaskConnected,
} from './services/AccountService';
import { onAccountsChanged } from './services/EthereumService';
import { tokenStore, tokenManagerStore, IToken } from './index';
import { BigNumber } from '../utils/BigNumber';

export class AccountStore {
  @observable accounts: string[] = [];
  @observable allowance = new Map<string, BigNumber>();

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

  @action.bound
  async initAllowance() {
    await Promise.all(tokenStore.validTokens.map(this.fetchAllowance));
  }

  @action.bound
  async fetchAllowance(token: IToken) {
    const owner = this.defaultAccount;
    const spender = tokenManagerStore.address;
    const allowance = await token.erc20.methods
      .allowance(owner, spender)
      .call();

    this.allowance.set(`${owner}_${token.symbol}`, allowance);
  }

  hasAllowance(tokenSymbol: string) {
    const owner = this.defaultAccount;
    const allowance = this.allowance.get(`${owner}_${tokenSymbol}`);
    return allowance ? !allowance.isZero() : false;
  }

  async approveFullAllowance(token: IToken) {
    const { erc20 } = token;
    const spender = tokenManagerStore.address;
    const amount = await erc20.methods.totalSupply.call();
    const owner = this.defaultAccount;

    await token.erc20.methods
      .approve(spender, amount.toString())
      .send({ from: owner });

    // TODO: subscribe to approval event and update allowance once succeed.
    // Not sure if this is a good place to subscribe.
  }
}
