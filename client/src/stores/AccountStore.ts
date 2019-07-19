import { observable, action, computed } from 'mobx';
import {
  getAccounts,
  connectToMetaMask,
  setMetaMaskConnected,
  isMetaMaskConnected,
} from './services/AccountService';
import { onAccountsChanged } from './services/EthereumService';
import { tokenStore, tokenManagerStore } from './index';
import { BigNumber } from '../utils/BigNumber';
import { IToken } from '../constants/Token';
import {
  getFreedCollateral,
  withdrawFreedCollateral,
} from './services/LoanManagerService';

export class AccountStore {
  @observable accounts: string[] = [];
  @observable allowance = new Map<string, BigNumber>();
  @observable freedCollateralsMap = new Map<string, BigNumber>();

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
    await Promise.all(tokenStore.validTokens.map(this.fetchAndUpdateAllowance));
  }

  @action.bound
  async fetchAndUpdateAllowance(token: IToken) {
    const allowance = await this.fetchAllowance(token);
    this.updateAllowance(token.symbol, allowance);
  }

  async fetchAllowance(token: IToken) {
    const owner = this.defaultAccount;
    const spender = tokenManagerStore.address;
    const allowance = await token.erc20.methods
      .allowance(owner, spender)
      .call();

    return allowance;
  }

  hasAllowance(tokenSymbol: string) {
    const owner = this.defaultAccount;
    const allowance = this.allowance.get(`${owner}_${tokenSymbol}`);
    return allowance ? !allowance.isZero() : false;
  }

  @action.bound
  async approveFullAllowance(token: IToken) {
    const { erc20 } = token;
    const owner = this.defaultAccount;
    const spender = tokenManagerStore.address;

    // Subscribe to Approval event and update allowance if succeed
    erc20.events
      .Approval({
        filter: {
          owner,
          spender,
        },
      })
      .on('data', (event: any) => {
        const newAllowance = event.returnValues.value;
        this.updateAllowance(token.symbol, newAllowance);
      });

    const amount = await erc20.methods.totalSupply.call();

    await erc20.methods
      .approve(spender, amount.toString())
      .send({ from: owner });
  }

  @action.bound
  updateAllowance(tokenSymbol: string, value: BigNumber) {
    const owner = this.defaultAccount;
    this.allowance.set(`${owner}_${tokenSymbol}`, value);
  }

  @action.bound
  async getFreedCollateral(token: IToken) {
    const freedCollateral = await getFreedCollateral(token.address);
    this.setFreedCollateral(token.address, freedCollateral);
  }

  @action.bound
  setFreedCollateral(tokenAddress: string, freedCollateral: BigNumber) {
    this.freedCollateralsMap.set(tokenAddress, freedCollateral);
  }

  getFreedCollateralByAddress(tokenAddress: string) {
    return this.freedCollateralsMap.get(tokenAddress);
  }

  @action.bound
  withdrawFreedCollateral(tokenAddress: string, amount: BigNumber) {
    return withdrawFreedCollateral(tokenAddress, amount);
  }
}
