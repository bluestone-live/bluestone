import { observable, action, computed } from 'mobx';
import { getTokenAddress } from './services/TokenService';
import {
  isDepositAssetEnabled,
  getDepositInterestRates,
  IAnnualPercentageRateValues,
} from './services/DepositManagerService';
import { getLoanInterestRate } from './services/ConfigurationService';

export interface IToken {
  symbol: string;
  address: string;
  defaultLoanPair: string;
  depositAnnualPercentageRates?: IAnnualPercentageRateValues;
  loanAnnualPercentageRates?: IAnnualPercentageRateValues;
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
    const tokens = Array.from(this.tokens.keys());
    await Promise.all(tokens.map(this.loadTokenIfNeeded));
    await Promise.all(tokens.map(this.isDepositAssetEnabled));
    await Promise.all(tokens.map(this.getDepositInterestRates));
    await Promise.all(tokens.map(this.getLoanInterestRates));
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
  async getDepositInterestRates(tokenSymbol: string) {
    const token = this.tokens.get(tokenSymbol);
    if (!token) {
      throw new Error(`no such token: ${tokenSymbol}`);
    }
    const rates = await getDepositInterestRates(token.address);
    return this.updateToken(tokenSymbol, {
      ...token,
      depositAnnualPercentageRates: {
        1: rates[0],
        7: rates[1],
        30: rates[2],
      },
    });
  }

  @action.bound
  async getLoanInterestRates(tokenSymbol: string) {
    const token = this.tokens.get(tokenSymbol);
    if (!token) {
      throw new Error(`no such token: ${tokenSymbol}`);
    }
    const terms = [1, 7, 30];
    const rates = await Promise.all(
      terms.map(term => getLoanInterestRate(token.address, term)),
    );
    this.updateToken(tokenSymbol, {
      ...token,
      loanAnnualPercentageRates: {
        1: rates[0],
        7: rates[1],
        30: rates[2],
      },
    });
  }

  @action.bound
  updateToken(tokenSymbol: string, payload: IToken) {
    return this.tokens.set(tokenSymbol, payload);
  }
}
