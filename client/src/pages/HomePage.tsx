import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { Configuration, Account } from '../stores';

interface IProps {
  configuration: Configuration;
  account: Account;
}

@inject('configuration', 'account')
@observer
export default class Main extends React.Component<IProps> {
  async componentDidMount() {
    await this.props.configuration.getProfitRatio();
    await this.props.account.getAccount();
  }

  render() {
    return <div>Account: {this.props.account.accountName}</div>;
  }
}
