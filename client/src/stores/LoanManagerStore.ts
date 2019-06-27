import { observable, action } from 'mobx';
import { tokenStore } from './index';
import { isLoanAssetPairEnabled } from './services/LoanManagerService';
import { getCollateralRatio } from './services/ConfigurationService';
import { BigNumber } from '../utils/BigNumber';

interface ILoanAssetPair {
  loanTokenSymbol: string;
  collateralTokenSymbol: string;
  isEnabled: boolean;
  collateralRatio: BigNumber;
}

export class LoanManagerStore {
  @observable loanAssetPairs = new Map<string, ILoanAssetPair | null>([
    ['ETH_DAI', null],
    ['ETH_USDC', null],
    ['DAI_ETH', null],
    ['DAI_USDC', null],
    ['USDC_ETH', null],
    ['USDC_DAI', null],
  ]);

  @action.bound
  async init() {
    const tokenPairSymbolList = Array.from(this.loanAssetPairs.keys());
    await Promise.all(tokenPairSymbolList.map(this.initLoanAssetPair));
  }

  getLoanAssetPair(loanTokenSymbol: string, collateralTokenSymbol: string) {
    const tokenPairSymbol = `${loanTokenSymbol}_${collateralTokenSymbol}`.toUpperCase();
    return this.loanAssetPairs.get(tokenPairSymbol);
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
