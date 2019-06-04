import { observable, action } from 'mobx';
import { getAccount } from './services/Account.service';

export class Account {
  @observable accountName: string = 'ZhangRui';

  @action.bound
  async getAccountSuccess(account: any) {
    this.accountName = account;
  }

  @action.bound
  async getAccount() {
    const account = await getAccount();
    return this.getAccountSuccess(account);
  }
}
