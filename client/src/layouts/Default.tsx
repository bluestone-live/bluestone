import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { observer, inject } from 'mobx-react';
import styled from 'styled-components';
import { AccountStore } from '../stores';
import Header from '../components/common/Header';
import AuthorizationReminder from '../containers/AuthorizationReminder';
import Card from '../components/common/Card';
import Container from '../components/common/Container';
import { ThemedProps } from '../styles/themes';
import Message from '../components/common/Message';

interface IProps extends WithTranslation {
  children: React.ReactChild;
  accountStore: AccountStore;
  title?: React.ReactChild | React.ReactChild[];
}

const StyledDefaultLayout = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: ${(props: ThemedProps) => props.theme.gap.largest};
  font-family: ${(props: ThemedProps) => props.theme.fontFamily};
  font-size: ${(props: ThemedProps) => props.theme.fontSize.medium};
`;

const StyledHeaderCard = styled(Card)`
  width: 1024px;
  margin-bottom: ${(props: ThemedProps) => props.theme.gap.largest};
`;

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  width: 1024px;
`;

@inject('accountStore')
@observer
class Default extends React.Component<IProps> {
  async componentDidMount() {
    const { accountStore } = this.props;
    // auto connect after first time
    const isMetaMaskConnected = await accountStore.isMetaMaskConnected();
    if (isMetaMaskConnected) {
      await accountStore.getAccounts();
      accountStore.bindOnUpdateEvent();
      await accountStore.initAllowance();
    }
  }

  getAccounts = async () => {
    const { accountStore } = this.props;
    if (accountStore.defaultAccount) {
      return;
    }
    await accountStore.connectToMetaMask();
    await accountStore.getAccounts();
  };

  showMessage = () => Message.info('message');

  render() {
    const { children, accountStore } = this.props;
    return (
      <StyledDefaultLayout className="layout default">
        <StyledHeaderCard>
          <Header
            defaultAccount={accountStore.defaultAccount}
            onAccountClick={this.getAccounts}
          />
        </StyledHeaderCard>
        <StyledMain>
          <Container>
            {accountStore.defaultAccount ? children : <AuthorizationReminder />}
          </Container>
          <button onClick={this.showMessage}>show message</button>
        </StyledMain>
      </StyledDefaultLayout>
    );
  }
}

export default withTranslation()(Default);
