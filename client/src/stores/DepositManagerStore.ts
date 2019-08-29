import { observable, action } from 'mobx';
import { getDepositTerms } from './services/DepositManagerService';
import { ITerm } from '../constants/Term';
import { BigNumber } from '../utils/BigNumber';

export class DepositManagerStore {
  @observable depositTerms: ITerm[] = [];

  @action.bound
  async init() {
    const depositTerms = await getDepositTerms();
    this.depositTerms = depositTerms
      .map((term: BigNumber) => Number.parseFloat(term.toString()))
      .sort((a, b) => a - b)
      .map(term => {
        return { text: `${term}-Day`, value: term };
      });
  }
}
