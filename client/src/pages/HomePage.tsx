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
  render() {
    return <div>Account: {this.props.account.defaultAccount}</div>;
  }
}
