import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import Header from '../components/common/Header';

interface IProps extends RouteComponentProps, WithTranslation {
  children: React.ReactChild;
  account: Account;
  title?: string | React.ReactChildren;
}

interface IStates {
  openDrawer: boolean;
}

@inject('account')
@observer
class Default extends React.Component<IProps, IStates> {
  state = {
    openDrawer: false,
  };

  toggleDrawer = () => {
    this.setState({
      openDrawer: !this.state.openDrawer,
    });
  };

  render() {
    const { children } = this.props;
    return (
      <div className="layout default">
        <Header />
        <div className="container">{children}</div>
      </div>
    );
  }
}

export default withTranslation()(Default);
