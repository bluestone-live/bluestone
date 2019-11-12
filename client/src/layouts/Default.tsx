import React, { useCallback } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import styled from 'styled-components';
import Header from '../components/common/Header';
import Card from '../components/common/Card';
import Container from '../components/common/Container';
import { ThemedProps } from '../styles/themes';
import { RouteComponentProps, withRouter } from 'react-router';
import {
  useDefaultAccount,
  CommonActions,
  useAvailableDepositTokens,
  IToken,
  AccountActions,
} from '../stores';
import { useEffectAsync } from '../utils/useEffectAsync';
import { getService } from '../services';
import { useDispatch } from 'react-redux';

interface IProps extends WithTranslation, RouteComponentProps {
  children: React.ReactChild;
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

const DefaultLayout = (props: IProps) => {
  const { children, history } = props;
  const dispatch = useDispatch();

  // Selector
  const defaultAccount = useDefaultAccount();
  const availableDepositTokens = useAvailableDepositTokens();

  // Initialize
  useEffectAsync(async () => {
    const { commonService } = await getService();
    const protocolContractAddress = await commonService.getProtocolContractAddress();
    CommonActions.setProtocolContractAddress(protocolContractAddress);
    CommonActions.setAllowance(
      availableDepositTokens.map(async (token: IToken) => ({
        tokenAddress: token.tokenAddress,
        allowance: await commonService.getTokenAllowance(
          token,
          defaultAccount,
          protocolContractAddress,
        ),
      })),
    );

    commonService.bindEthereumStateChangeEvent(getAccounts, () => {
      window.location.reload();
    });

    if (!defaultAccount) {
      getAccounts();
    }
  });

  // Callback

  const getAccounts = useCallback(async () => {
    const { accountService, commonService } = await getService();
    await commonService.enableEthereumNetwork();
    dispatch(AccountActions.setAccounts(await accountService.getAccounts()));
  }, [getService]);

  const onAccountClickHandler = useCallback(async () => {
    if (defaultAccount) {
      return history.push('/account');
    }
    getAccounts();
  }, [defaultAccount]);

  return (
    <StyledDefaultLayout className="layout default">
      <StyledHeaderCard>
        <Header
          defaultAccount={defaultAccount}
          onAccountClick={onAccountClickHandler}
        />
      </StyledHeaderCard>
      <StyledMain>
        <Container>{defaultAccount && children}</Container>
      </StyledMain>
    </StyledDefaultLayout>
  );
};

export default withTranslation()(withRouter(DefaultLayout));
