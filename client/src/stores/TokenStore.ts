import { observable, action, computed } from 'mobx';
import { getTokenAddress, getERC20Token } from './services/TokenService';
import {
  isDepositAssetEnabled,
  getDepositInterestRate,
} from './services/DepositManagerService';
import { getLoanInterestRate } from './services/ConfigurationService';
import { IToken, SupportToken } from '../constants/Token';
import { getPrice } from './services/PriceOracleService';
import { IAnnualPercentageRateValues } from '../constants/Rate';
import { ITerm } from '../constants/Term';

export class TokenStore {
  @observable tokens = new Map<string, IToken | null>(
    SupportToken.map(token => [token, null]),
  );

  @computed get validTokens(): IToken[] {
    return Array.from(this.tokens.values()).filter(
      token => token !== null,
    ) as IToken[];
  }

  getToken(tokenSymbol: string) {
    return this.tokens.get(tokenSymbol);
  }

  getTokenByAddress(tokenAddress: string) {
    return Array.from(this.tokens.values()).find(
      token => token && token.address === tokenAddress,
    );
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
    const tokenSymbols = Array.from(this.tokens.keys());
    const tokens = await Promise.all(tokenSymbols.map(this.loadTokenIfNeeded));
    await Promise.all(tokenSymbols.map(this.isDepositAssetEnabled));
    await Promise.all(tokenSymbols.map(this.getTokenPrice));
    return tokens;
  }

  @action.bound
  async loadToken(tokenSymbol: string) {
    const address = await getTokenAddress(tokenSymbol);
    const erc20 = await getERC20Token(address);

    // TODO: Register test tokens for MetaMask.
    // const res = await registerToken(tokenSymbol);

    const token: IToken = {
      symbol: tokenSymbol,
      defaultLoanPair:
        tokenSymbol === 'ETH' ? `${tokenSymbol}_DAI` : `${tokenSymbol}_ETH`,
      address,
      depositEnabled: false,
      erc20,
    };

    this.updateToken(tokenSymbol, token);
    return token;
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
  async getDepositInterestRates(tokenSymbol: string, terms: ITerm[]) {
    const token = this.tokens.get(tokenSymbol);
    if (!token) {
      throw new Error(`no such token: ${tokenSymbol}`);
    }
    const depositAnnualPercentageRates: IAnnualPercentageRateValues = {};
    for (const term of terms) {
      const interest = await getDepositInterestRate(token.address, term.value);

      // TODO: the interest we get is per second, not per year. Rename it.
      depositAnnualPercentageRates[term.value] = interest;
    }
    return this.updateToken(tokenSymbol, {
      ...token,
      depositAnnualPercentageRates,
    });
  }

  @action.bound
  async getLoanInterestRates(tokenSymbol: string, terms: ITerm[]) {
    const token = this.tokens.get(tokenSymbol);
    if (!token) {
      throw new Error(`no such token: ${tokenSymbol}`);
    }
    const loanAnnualPercentageRates: IAnnualPercentageRateValues = {};
    for (const term of terms) {
      const interest = await getLoanInterestRate(token.address, term.value);

      // TODO: the interest we get is per second, not per year. Rename it.
      loanAnnualPercentageRates[term.value] = interest;
    }

    this.updateToken(tokenSymbol, {
      ...token,
      loanAnnualPercentageRates,
    });
  }

  @action.bound
  async getTokenPrice(tokenSymbol: string) {
    const token = this.tokens.get(tokenSymbol);
    if (!token) {
      throw new Error(`no such token: ${tokenSymbol}`);
    }
    const tokenPriceOracle = await getPrice(token.address);
    this.updateToken(tokenSymbol, {
      ...token,
      price: tokenPriceOracle,
    });
  }

  @action.bound
  updateToken(tokenSymbol: string, payload: IToken) {
    return this.tokens.set(tokenSymbol, payload);
  }
}
