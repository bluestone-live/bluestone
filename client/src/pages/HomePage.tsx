import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { TokenStore, AccountStore } from '../stores';
import styled from 'styled-components';
import { WithTranslation, withTranslation } from 'react-i18next';
import Anchor from '../components/html/Anchor';
import {
  calculateRate,
  RatePeriod,
} from '../utils/interestRateCalculateHelper';
import { ThemedProps } from '../styles/themes';
import Radio from '../components/common/Radio';
import Card from '../components/common/Card';
import Button from '../components/html/Button';
import { ITerm, terms } from '../constants/Term';
import { IToken, defaultTokenPairs } from '../constants/Token';
import { BigNumber, convertWeiToDecimal } from '../utils/BigNumber';

const StyledTokenList = styled.table`
  width: 100%;
  border: 1px solid ${(props: ThemedProps) => props.theme.borderColor.secondary};
  border-spacing: 0;

  & thead th {
    height: 60px;
    font-weight: normal;
    font-size: ${(props: ThemedProps) => props.theme.fontSize.medium};
    color: ${(props: ThemedProps) => props.theme.fontColors.secondary};
  }
`;

const StyledTokenListRow = styled.tr`
  height: 100px;

  & td {
    text-align: center;
    padding: 0;
    border-top: 1px solid
      ${(props: ThemedProps) => props.theme.borderColor.secondary};
  }
`;

const StyledActionBar = styled.div`
  display: flex;
  justify-content: flex-end;
  height: 60px;
  align-items: stretch;
  padding-right: ${(props: ThemedProps) => props.theme.gap.medium};
`;

const StyledTermSelector = styled.div`
  display: flex;
  align-items: center;
`;

const StyledAnchor = styled(Anchor)`
  border: 1px solid ${(props: ThemedProps) => props.theme.borderColor.secondary};
  margin: 0 ${(props: ThemedProps) => props.theme.gap.small};
  display: inline-block;
  min-width: 100px;
  padding: 0 ${(props: ThemedProps) => props.theme.gap.small};
  height: 30px;
  line-height: 30px;
  border-radius: ${(props: ThemedProps) => props.theme.borderRadius.medium};
`;

const StyledPrimaryAnchor = styled(StyledAnchor)`
  background-color: ${(props: ThemedProps) => props.theme.colors.primary};
  color: ${(props: ThemedProps) => props.theme.fontColors.inverted};
  border-color: transparent;

  &:hover {
    color: ${(props: ThemedProps) => props.theme.fontColors.inverted};
    background-color: ${(props: ThemedProps) =>
      props.theme.colors.primaryLight};
  }
`;

interface IProps extends WithTranslation {
  tokenStore: TokenStore;
  accountStore: AccountStore;
}

interface IState {
  selectedTerm: ITerm;
}

@inject('tokenStore', 'accountStore')
@observer
class HomePage extends React.Component<IProps, IState> {
  state = {
    selectedTerm: terms[0],
  };

  onTermSelect = (value: number) => {
    const term = terms.find(t => t.value === value);
    if (!term) {
      return;
    }
    this.setState({
      selectedTerm: term,
    });
  };

  renderActions(token: IToken) {
    const { accountStore, t } = this.props;

    const onEnableToken = async () => {
      await accountStore.approveFullAllowance(token);
    };

    if (accountStore.hasAllowance(token.symbol)) {
      const collateralTokenSymbol = defaultTokenPairs[token.symbol];

      return (
        <React.Fragment>
          <StyledAnchor to={`/deposit/${token.symbol}`}>
            {t('deposit')}
          </StyledAnchor>
          <StyledPrimaryAnchor
            to={`/loan?loanTokenSymbol=${token.symbol}&collateralTokenSymbol=${collateralTokenSymbol}&term=30`}
          >
            {t('loan')}
          </StyledPrimaryAnchor>
        </React.Fragment>
      );
    } else {
      // TODO: show button loading state
      return (
        <React.Fragment>
          <Button primary onClick={onEnableToken}>
            {t('enable')}
          </Button>
        </React.Fragment>
      );
    }
  }

  render() {
    const {
      t,
      tokenStore: { validTokens },
      accountStore,
    } = this.props;
    const { selectedTerm } = this.state;

    return (
      <div>
        <Card>
          <StyledActionBar>
            <StyledTermSelector>
              {t('select_term')}
              <Radio
                name="term"
                onChange={this.onTermSelect}
                selectedOption={selectedTerm}
                options={terms}
              />
            </StyledTermSelector>
          </StyledActionBar>
          <StyledTokenList>
            <thead>
              <tr>
                <th style={{ minWidth: '200px' }}>{t('token')}</th>
                <th style={{ minWidth: '180px' }}>{t('deposit_apr')}</th>
                <th style={{ minWidth: '180px' }}>{t('loan_apr')}</th>
                <th style={{ minWidth: '160px' }}>{t('freed_collateral')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {validTokens
                .map((token): [IToken, BigNumber | undefined] => [
                  token,
                  accountStore.getFreedCollateralByAddress(token.address),
                ])
                .map(([token, freedCollateral]) => (
                  <StyledTokenListRow key={token.symbol}>
                    <td>
                      <Anchor
                        to={`/transactions?tokenSymbol=${token.symbol}&term=&status=`}
                      >
                        {token.logo}
                        {token.symbol}
                      </Anchor>
                    </td>
                    <td>
                      {token.depositAnnualPercentageRates
                        ? `${calculateRate(
                            token.depositAnnualPercentageRates[
                              selectedTerm.value
                            ],
                            RatePeriod.Annual,
                          ).toFixed(2)}%`
                        : '0%'}
                    </td>
                    <td>
                      {token.loanAnnualPercentageRates
                        ? `${calculateRate(
                            token.loanAnnualPercentageRates[selectedTerm.value],
                            RatePeriod.Annual,
                          ).toFixed(2)}%`
                        : '0%'}
                    </td>
                    <td>
                      {freedCollateral
                        ? convertWeiToDecimal(freedCollateral)
                        : 0}
                    </td>
                    <td>{this.renderActions(token)}</td>
                  </StyledTokenListRow>
                ))}
              <tr />
            </tbody>
          </StyledTokenList>
        </Card>
      </div>
    );
  }
}

export default withTranslation()(HomePage);
