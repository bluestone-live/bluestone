import { observable, action } from 'mobx';
import { getTokenAddress } from './services/TokenService';

interface IToken {
  address: string;
}

export class TokenStore {
  // TODO: add type
  @observable tokens = new Map();

  getToken(tokenSymbol: string) {
    return this.tokens.get(tokenSymbol);
  }

  @action.bound
  async loadTokenIfNeeded(tokenSymbol: string) {
    if (!this.tokens.has(tokenSymbol)) {
      await this.loadToken(tokenSymbol);
    }
  }

  @action.bound
  async loadToken(tokenSymbol: string) {
    const address = await getTokenAddress(tokenSymbol);
    this.updateToken(tokenSymbol, { address });
  }

  @action.bound
  updateToken(tokenSymbol: string, payload: IToken) {
    this.tokens.set(tokenSymbol, payload);
  }
}
