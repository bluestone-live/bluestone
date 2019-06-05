import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { observer, inject } from 'mobx-react';
import styled from 'styled-components';
import { Account } from '../stores';
import Header from '../components/common/Header';
import AuthorizationReminder from '../containers/Authorization';

interface IProps extends WithTranslation {
  children: React.ReactChild;
  account: Account;
  title?: string | React.ReactChildren;
}

const StyledContainer = styled.div`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  margin: 0 auto;
  padding: 0;
  font-family: ${props => props.theme.fontFamily};
  font-size: ${props => props.theme.fontSize};
  background-color: ${props => props.theme.backgroundColor};
`;

@inject('account')
@observer
class Default extends React.Component<IProps> {
  async componentDidMount() {
    await this.props.account.getAccounts();
  }

  render() {
    const { children, account } = this.props;
    return (
      <div className="layout default">
        <Header defaultAccount={account.defaultAccount} />
        {account.defaultAccount ? (
          <StyledContainer className="container">{children}</StyledContainer>
        ) : (
          <AuthorizationReminder />
        )}
      </div>
    );
  }
}

export default withTranslation()(Default);
