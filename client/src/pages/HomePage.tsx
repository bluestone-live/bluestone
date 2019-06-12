import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { TokenStore, Term } from '../stores';
import DropDown from '../components/common/Dropdown';
import styled from 'styled-components';
import { WithTranslation, withTranslation } from 'react-i18next';
import Anchor from '../components/html/Anchor';

const StyledHomePage = styled.div`
  height: 100%;
`;

const StyledTokenList = styled.table`
  width: 100%;
  border: 1px solid ${props => props.theme.borderColor};
  border-spacing: 0;

  & thead th {
    height: 50px;
  }
`;

const StyledTokenListRow = styled.tr`
  height: 50px;

  & td {
    text-align: center;
    padding: 0;
    border-top: 1px solid ${props => props.theme.borderColor};
  }

  &:hover {
    background-color: #f8f8f8;
  }
`;

const StyledActionBar = styled.div`
  display: flex;
  background-color: #fff;
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: ${props => props.theme.borderRadius};
  margin-bottom: ${props => props.theme.spacingUnit.small};
  justify-content: space-evenly;
`;

const StyledHomePageDropDown = styled(DropDown)`
  border: 0;
`;

const StyledAnchor = styled(Anchor)`
  border: 1px solid ${props => props.theme.borderColor};
  margin: 0 8px;
  padding: 6px 8px;
  border-radius: ${props => props.theme.borderRadius};
  background-color: #fff;
`;

interface IProps extends WithTranslation {
  tokenStore: TokenStore;
}

interface ITermOption {
  text: string;
  key: Term;
}

interface IState {
  selectedTerm: ITermOption;
}

const terms: ITermOption[] = [
  {
    text: '1 Day',
    key: Term['1D'],
  },
  {
    text: '7 Days',
    key: Term['7D'],
  },
  {
    text: '30 Days',
    key: Term['30D'],
  },
];

@inject('tokenStore')
@observer
class HomePage extends React.Component<IProps, IState> {
  state = {
    selectedTerm: terms[0],
  };

  onTermSelect = (termOption: ITermOption) =>
    this.setState({
      selectedTerm: termOption,
    });

  render() {
    const {
      t,
      tokenStore: { validTokens },
    } = this.props;
    const { selectedTerm } = this.state;

    return (
      <StyledHomePage>
        <StyledActionBar>
          {t('select_term')!}
          <StyledHomePageDropDown
            options={terms}
            onSelected={this.onTermSelect}
          >
            {selectedTerm.text}
          </StyledHomePageDropDown>
        </StyledActionBar>
        <StyledTokenList>
          <thead>
            <tr>
              <th>Token</th>
              <th>Deposit ARP</th>
              <th>Loan ARP</th>
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
                  {token.depositAnnulPercentageRate
                    ? token.depositAnnulPercentageRate[selectedTerm.key]
                    : '0%'}
                </td>
                <td>
                  {token.loanAnnulPercentageRate
                    ? token.loanAnnulPercentageRate[selectedTerm.key]
                    : '0%'}
                </td>
                <td>
                  <StyledAnchor to={`/deposit/${token.symbol}`}>
                    Deposit
                  </StyledAnchor>
                  <StyledAnchor to={`/loan/${token.defaultLoanPair}`}>
                    Loan
                  </StyledAnchor>
                </td>
              </StyledTokenListRow>
            ))}
            <tr />
          </tbody>
        </StyledTokenList>
      </StyledHomePage>
    );
  }
}

export default withTranslation()(HomePage);
