import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { observer, inject } from 'mobx-react';
import styled from 'styled-components';
import { Account } from '../stores';
import Header from '../components/common/Header';
import Container from '../components/common/Container';
import AuthorizationReminder from '../containers/Authorization';

interface IProps extends WithTranslation {
  children: React.ReactChild;
  account: Account;
  title?: string | React.ReactChildren;
}

const StyledMain = styled.main`
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
        <StyledMain>
          <Container>
            {account.defaultAccount ? children : <AuthorizationReminder />}
          </Container>
        </StyledMain>
      </div>
    );
  }
}

export default withTranslation()(Default);
