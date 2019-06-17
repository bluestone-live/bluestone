import { observable, action } from 'mobx';
import { getProfitRatio } from './services/ConfigurationService';
import { BigNumber } from '../utils/BigNumber';

export class ConfigurationStore {
  @observable profitRatio: BigNumber = new BigNumber(0);

  @action.bound
  getProfitRatioSuccess(res: BigNumber) {
    this.profitRatio = res;
  }

  @action.bound async getProfitRatio() {
    const res = await getProfitRatio();
    return this.getProfitRatioSuccess(res);
  }
}
