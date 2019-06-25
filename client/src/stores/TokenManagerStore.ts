import { observable, action } from 'mobx';
import { getTokenManagerAddress } from './services/TokenManagerService';

export class TokenManagerStore {
  @observable address: string = '0x0';

  @action.bound
  async init() {
    this.address = await getTokenManagerAddress();
  }
}
