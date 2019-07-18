import { action } from 'mobx';
import { wrap, unwrap } from './services/TokenService';
import { BigNumber } from '../utils/BigNumber';

export class WethStore {
  @action.bound
  wrap(amount: BigNumber) {
    return wrap(amount);
  }

  @action.bound
  unwrap(amount: BigNumber) {
    return unwrap(amount);
  }
}
