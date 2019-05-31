import { observable, action } from 'mobx';

export class Account {
  @observable accountName: string = 'ZhangRui';

  @observable address: string = '0x11111';

  @action.bound
  getAddressSuccess(address: string) {
    this.address = address;
  }

  @action.bound
  async getAddress() {
    // TODO: call web3 method
    return this.getAddressSuccess('');
  }
}
