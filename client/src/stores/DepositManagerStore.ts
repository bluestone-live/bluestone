import { observable, action } from 'mobx';
import { getDepositTerms } from './services/DepositManagerService';
import { ITerm } from '../constants/Term';

export class DepositManagerStore {
  @observable depositTerms: ITerm[] = [];

  @action.bound
  async init() {
    const depositTerms = await getDepositTerms();
    this.depositTerms = depositTerms
      .sort((a, b) => a - b)
      .map(term => {
        return { text: `${term}-Day`, value: term };
      });
  }
}
