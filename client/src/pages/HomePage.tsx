import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { TokenStore, AccountStore } from '../stores';
import styled from 'styled-components';
import { WithTranslation, withTranslation } from 'react-i18next';
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
import { RouteComponentProps, withRouter } from 'react-router';

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
  cursor: pointer;

  &:hover {
    background-color: ${(props: ThemedProps) =>
      props.theme.backgroundColor.hover};
  }

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

const StyledButton = styled(Button)`
  margin: 0 ${(props: ThemedProps) => props.theme.gap.small};
`;

interface IProps extends WithTranslation, RouteComponentProps {
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

  goTo = (path: string) => (
    e: React.MouseEvent<HTMLTableRowElement | HTMLButtonElement, MouseEvent>,
  ) => {
    e.stopPropagation();
    this.props.history.push(path);
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
          <StyledButton onClick={this.goTo(`/deposit/${token.symbol}`)}>
            {t('deposit')}
          </StyledButton>
          <StyledButton
            primary
            onClick={this.goTo(
              `/loan?loanTokenSymbol=${token.symbol}&collateralTokenSymbol=${collateralTokenSymbol}&term=30`,
            )}
          >
            {t('loan')}
          </StyledButton>
        </React.Fragment>
      );
    } else {
      // TODO: show button loading state
      return (
        <React.Fragment>
          <StyledButton primary onClick={onEnableToken}>
            {t('enable')}
          </StyledButton>
        </React.Fragment>
      );
    }
  }

  render() {
    const {
      t,
      tokenStore: { validTokens },
    } = this.props;
    const { selectedTerm } = this.state;

    return (
      <div>
        <Card>
          <StyledActionBar>
            <StyledTermSelector>
              {t('select_term')}:
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
                <th style={{ minWidth: '220px' }}>{t('asset')}</th>
                <th style={{ minWidth: '240px' }}>{t('deposit_apr')}</th>
                <th style={{ minWidth: '240px' }}>{t('loan_apr')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {validTokens.map(token => (
                <StyledTokenListRow
                  key={token.symbol}
                  onClick={this.goTo(
                    `/records/deposit?currentToken=${token.address}`,
                  )}
                >
                  <td>
                    {token.logo}
                    {token.symbol}
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

export default withTranslation()(withRouter(HomePage));
