import { observable, action, computed } from 'mobx';
import { tokenStore } from './index';
import {
  getLoanTerms,
  isLoanAssetPairEnabled,
} from './services/LoanManagerService';
import { getCollateralRatio } from './services/ConfigurationService';
import { BigNumber } from '../utils/BigNumber';
import { ITerm } from '../constants/Term';

interface ILoanAssetPair {
  loanTokenSymbol: string;
  collateralTokenSymbol: string;
  isEnabled: boolean;
  collateralRatio: BigNumber;
}

export class LoanManagerStore {
  @observable loanTerms: ITerm[] = [];

  @observable loanAssetPairs = new Map<string, ILoanAssetPair | null>([
    ['ETH_DAI', null],
    ['ETH_USDT', null],
    ['DAI_ETH', null],
    ['DAI_USDT', null],
    ['USDT_ETH', null],
    ['USDT_DAI', null],
  ]);

  @action.bound
  async init() {
    await this.initLoanTerms();
    const tokenPairSymbolList = Array.from(this.loanAssetPairs.keys());
    await Promise.all(tokenPairSymbolList.map(this.initLoanAssetPair));
  }

  @computed
  get validTokenSymbolPairs() {
    return Array.from(this.loanAssetPairs.keys())
      .map(key => key.split('_'))
      .reduce<{ [key: string]: string[] }>(
        (tokenSymbolPairs, [loanSymbol, collateralSymbol]) => {
          if (tokenSymbolPairs[loanSymbol]) {
            return {
              ...tokenSymbolPairs,
              [loanSymbol]: [...tokenSymbolPairs[loanSymbol], collateralSymbol],
            };
          }
          return {
            ...tokenSymbolPairs,
            [loanSymbol]: [collateralSymbol],
          };
        },
        {},
      );
  }

  getCollateralSymbolsByLoanSymbol(loanTokenSymbol: string) {
    return this.validTokenSymbolPairs[loanTokenSymbol];
  }

  getLoanAssetPair(loanTokenSymbol: string, collateralTokenSymbol: string) {
    const tokenPairSymbol = `${loanTokenSymbol}_${collateralTokenSymbol}`.toUpperCase();
    return this.loanAssetPairs.get(tokenPairSymbol);
  }

  @action.bound
  async initLoanTerms() {
    const loanTerms = await getLoanTerms();
    this.loanTerms = loanTerms
      .sort((a, b) => a - b)
      .map(term => {
        return { text: `${term}-Day`, value: term };
      });
  }

  @action.bound
  async initLoanAssetPair(tokenPairSymbol: string) {
    const [loanTokenSymbol, collateralTokenSymbol] = tokenPairSymbol.split('_');
    const loanToken = tokenStore.getToken(loanTokenSymbol);
    const collateralToken = tokenStore.getToken(collateralTokenSymbol);

    if (!loanToken || !collateralToken) {
      throw new Error('Make sure tokens have been initialized in TokenStore.');
    }

    const isEnabled = await isLoanAssetPairEnabled(
      loanToken.address,
      collateralToken.address,
    );

    const collateralRatio = await getCollateralRatio(
      loanToken.address,
      collateralToken.address,
    );

    this.updateLoanAssetPair(tokenPairSymbol, {
      loanTokenSymbol,
      collateralTokenSymbol,
      isEnabled,
      collateralRatio,
    });
  }

  @action.bound
  updateLoanAssetPair(tokenPairSymbol: string, payload: ILoanAssetPair) {
    return this.loanAssetPairs.set(tokenPairSymbol, payload);
  }
}
