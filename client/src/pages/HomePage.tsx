import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { Configuration } from '../stores';

interface IProps {
  configuration: Configuration;
}

@inject('configuration')
@observer
export default class Main extends React.Component<IProps> {
  async componentDidMount() {
    await this.props.configuration.getProfitRatio();
  }

  render() {
    return <div>Main: {this.props.configuration.profitRatio._hex}</div>;
  }
}
