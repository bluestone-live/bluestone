import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { TokenStore } from '../stores';
import styled from 'styled-components';
import { WithTranslation, withTranslation } from 'react-i18next';
import Anchor from '../components/html/Anchor';
import {
  calculateRate,
  RatePeriod,
} from '../utils/interestRateCalculateHelper';
import Card from '../components/common/Card';
import { ThemedProps } from '../styles/themes';
import Radio from '../components/common/Radio';

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
}

interface ITermOption {
  text: string;
  value: number;
}

interface IState {
  selectedTerm: ITermOption;
}

const terms: ITermOption[] = [
  {
    text: '1 Day',
    value: 1,
  },
  {
    text: '7 Days',
    value: 7,
  },
  {
    text: '30 Days',
    value: 30,
  },
];

@inject('tokenStore')
@observer
class HomePage extends React.Component<IProps, IState> {
  state = {
    selectedTerm: terms[0],
  };

  onTermSelect = (value: string | number) => {
    const term = terms.find(t => t.value === value);
    if (!term) {
      return;
    }
    this.setState({
      selectedTerm: term,
    });
  };

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
                <th style={{ minWidth: '220px' }}>{t('token')}</th>
                <th style={{ minWidth: '250px' }}>{t('deposit_apr')}</th>
                <th style={{ minWidth: '250px' }}>{t('loan_apr')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {validTokens.map(token => (
                <StyledTokenListRow key={token.symbol}>
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
                        )}%`
                      : '0%'}
                  </td>
                  <td>
                    {token.loanAnnualPercentageRates
                      ? `${calculateRate(
                          token.loanAnnualPercentageRates[selectedTerm.value],
                          RatePeriod.Annual,
                        )}%`
                      : '0%'}
                  </td>
                  <td>
                    <StyledAnchor to={`/deposit/${token.symbol}`}>
                      {t('deposit')}
                    </StyledAnchor>
                    <StyledPrimaryAnchor
                      to={`/loan?loanTokenSymbol=${token.symbol}`}
                    >
                      {t('loan')}
                    </StyledPrimaryAnchor>
                  </td>
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
