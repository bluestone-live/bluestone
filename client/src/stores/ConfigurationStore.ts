import { observable, action } from 'mobx';
import { ConfigurationService } from './services/ConfigurationService';
import { BigNumber, BN } from '../utils/BigNumber';

export class ConfigurationStore {
  @observable profitRatio: BigNumber = new BN(0);

  @action.bound
  getProfitRatioSuccess(res: typeof BN) {
    this.profitRatio = res;
  }

  @action.bound async getProfitRatio() {
    const res = await ConfigurationService.getProfitRatio();
    return this.getProfitRatioSuccess(res);
  }
}
