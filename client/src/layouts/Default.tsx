import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { observer, inject } from 'mobx-react';
import styled from 'styled-components';
import { AccountStore } from '../stores';
import Header from '../components/common/Header';
import AuthorizationReminder from '../containers/AuthorizationReminder';
import Container from '../components/common/Container';

interface IProps extends WithTranslation {
  children: React.ReactChild;
  accountStore: AccountStore;
  title?: React.ReactChild | React.ReactChild[];
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

@inject('accountStore')
@observer
class Default extends React.Component<IProps> {
  async componentDidMount() {
    const { accountStore } = this.props;
    /*
     * we should call getAccounts at first time,
     * because in some special cases we can get accounts before they confirm connect
     */
    accountStore.bindOnUpdateEvent();
  }

  render() {
    const { children, accountStore } = this.props;
    return (
      <div className="layout default">
        <Header
          defaultAccount={accountStore.defaultAccount}
          onAccountClick={accountStore.getAccounts}
        />
        <StyledMain>
          <Container>
            {accountStore.defaultAccount ? children : <AuthorizationReminder />}
          </Container>
        </StyledMain>
      </div>
    );
  }
}

export default withTranslation()(Default);
