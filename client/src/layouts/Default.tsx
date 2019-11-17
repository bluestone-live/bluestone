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
  IToken,
  AccountActions,
} from '../stores';
import { useComponentMounted } from '../utils/useEffectAsync';
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
  const enableEthereumNetwork = async () => {
    const { commonService } = await getService();
    await commonService.enableEthereumNetwork();
  };
  const getAccounts = async () => {
    const { accountService } = await getService();
    const accounts = await accountService.getAccounts();
    dispatch(AccountActions.setAccounts(accounts));
    return accounts;
  };

  // Selector
  const defaultAccount = useDefaultAccount();

  // Initialize
  useComponentMounted(async () => {
    const { commonService } = await getService();

    await enableEthereumNetwork();
    const accounts = await getAccounts();

    // Bind account and network change event
    commonService.bindEthereumStateChangeEvent(getAccounts, () => {
      window.location.reload();
    });

    const protocolContractAddress = await commonService.getProtocolContractAddress();
    dispatch(CommonActions.setProtocolContractAddress(protocolContractAddress));

    // Get User action lock
    dispatch(
      CommonActions.setUserActionsLock(
        await commonService.isUserActionsLocked(),
      ),
    );

    // Get deposit terms
    dispatch(
      CommonActions.setDepositTerms(await commonService.getDepositTerms()),
    );

    // Get deposit tokens
    const depositTokens = await Promise.all(
      (await commonService.getDepositTokens()).map(async (token: IToken) => ({
        ...token,
        allowance: await commonService.getTokenAllowance(
          token,
          accounts[0],
          protocolContractAddress,
        ),
      })),
    );
    dispatch(CommonActions.setDepositTokens(depositTokens));

    // Get loan pairs
    const loanAndCollateralTokenPairs = await commonService.getLoanAndCollateralTokenPairs();
    dispatch(
      CommonActions.setLoanPairs(
        await Promise.all(
          loanAndCollateralTokenPairs.map(async pair => {
            const { loanToken, collateralToken } = pair;
            const maxLoanTerm = await commonService.getMaxLoanTerm(
              pair.loanToken.tokenAddress,
            );
            const annualPercentageRate = await commonService.getLoanInterestRate(
              pair.loanToken.tokenAddress,
              maxLoanTerm,
            );
            const loanTokenPrice = await commonService.getPrice(
              loanToken.tokenAddress,
            );
            const collateralTokenPrice = await commonService.getPrice(
              collateralToken.tokenAddress,
            );
            return {
              ...pair,
              loanToken: {
                ...loanToken,
                price: loanTokenPrice,
              },
              collateralToken: {
                ...collateralToken,
                price: collateralTokenPrice,
              },
              maxLoanTerm,
              annualPercentageRate,
            };
          }),
        ),
      ),
    );
  });

  // Callback
  const onAccountClickHandler = useCallback(async () => {
    if (defaultAccount) {
      return history.push('/account');
    }
    enableEthereumNetwork();
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
