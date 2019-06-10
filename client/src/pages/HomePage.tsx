import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { ConfigurationStore, AccountStore } from '../stores';

interface IProps {
  configurationStore: ConfigurationStore;
  accountStore: AccountStore;
}

@inject('configurationStore', 'accountStore')
@observer
export default class Main extends React.Component<IProps> {
  render() {
    return <div>Account: {this.props.accountStore.defaultAccount}</div>;
  }
}
