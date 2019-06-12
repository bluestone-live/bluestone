import { observable, action, computed } from 'mobx';
import { getTokenAddress } from './services/TokenService';
import { isDepositAssetEnabled } from './services/DepositManagerService';

export const enum Term {
  '1D' = '1D',
  '7D' = '7D',
  '30D' = '30D',
}

type AnnulPercentageRateValues = { [term in Term]: number };

interface IToken {
  symbol: string;
  address: string;
  defaultLoanPair: string;
  depositAnnulPercentageRate?: AnnulPercentageRateValues;
  loanAnnulPercentageRate?: AnnulPercentageRateValues;
  logo?: string;
  depositEnabled: boolean;
}

export class TokenStore {
  @observable tokens = new Map<string, IToken | null>([
    ['ETH', null],
    ['DAI', null],
    ['USDC', null],
  ]);

  @computed get validTokens(): IToken[] {
    return Array.from(this.tokens.values()).filter(
      token => token !== null,
    ) as IToken[];
  }

  getToken(tokenSymbol: string) {
    return this.tokens.get(tokenSymbol);
  }

  @action.bound
  async loadTokenIfNeeded(tokenSymbol: string) {
    const token = this.tokens.get(tokenSymbol);
    if (!token) {
      return this.loadToken(tokenSymbol);
    }
    return token;
  }

  @action.bound
  async initTokens() {
    await Promise.all(
      Array.from(this.tokens.keys()).map(this.loadTokenIfNeeded),
    );
    return Promise.all(
      Array.from(this.tokens.keys()).map(this.isDepositAssetEnabled),
    );
  }

  @action.bound
  async loadToken(tokenSymbol: string) {
    const address = await getTokenAddress(tokenSymbol);
    return this.updateToken(tokenSymbol, {
      symbol: tokenSymbol,
      defaultLoanPair:
        tokenSymbol === 'ETH' ? `${tokenSymbol}_DAI` : `${tokenSymbol}_ETH`,
      address,
      depositEnabled: false,
    });
  }

  @action.bound
  async isDepositAssetEnabled(tokenSymbol: string) {
    const token = this.tokens.get(tokenSymbol);
    if (!token) {
      throw new Error(`no such token: ${tokenSymbol}`);
    }
    const depositEnabled = await isDepositAssetEnabled(token.address);
    return this.updateToken(token.symbol, { ...token, depositEnabled });
  }

  @action.bound
  updateToken(tokenSymbol: string, payload: IToken) {
    return this.tokens.set(tokenSymbol, payload);
  }
}
