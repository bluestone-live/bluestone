import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { AccountStore, TokenStore } from '../stores';
import { Row, Cell } from '../components/common/Layout';
import { inject, observer } from 'mobx-react';
import { convertWeiToDecimal } from '../utils/BigNumber';
import Button from '../components/html/Button';
import { IToken } from '../constants/Token';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';
import { ThemedProps } from '../styles/themes';

interface IProps extends WithTranslation, RouteComponentProps {
  accountStore?: AccountStore;
  tokenStore?: TokenStore;
}

const StyledRow = styled(Row)`
  padding: ${(props: ThemedProps) => props.theme.gap.medium} 0;
  border-bottom: 1px solid
    ${(props: ThemedProps) => props.theme.borderColor.primary};

  > div {
    align-self: center;
    padding: 0 ${(props: ThemedProps) => props.theme.gap.medium};
  }
`;

const StyledPanelHeader = styled.div`
  text-align: center;
  color: ${(props: ThemedProps) => props.theme.fontColors.secondary};
  padding: ${(props: ThemedProps) => props.theme.gap.medium} 0;
  border-bottom: 1px solid
    ${(props: ThemedProps) => props.theme.borderColor.primary};
`;

const StyledSymbolCell = styled(Cell)`
  text-align: center;
`;

const StyledAmountCell = styled(Cell)`
  text-align: right;
`;

const StyledActionCell = styled(Cell)`
  text-align: right;
`;

@inject('accountStore', 'tokenStore')
@observer
class FreedCollateralList extends React.Component<IProps> {
  goTo = (token: IToken) => () =>
    this.props.history.push(`/withdraw/${token.address}`);

  render() {
    const { accountStore, tokenStore, t } = this.props;

    const freedCollateralList = tokenStore!.validTokens.map(token => ({
      token,
      amount: convertWeiToDecimal(
        accountStore!.getFreedCollateralByAddress(token.address),
      ),
    }));

    return (
      <div className="freed-collateral-list">
        <StyledPanelHeader>
          {t('freed_collateral_list_title')}
        </StyledPanelHeader>
        {freedCollateralList.map(freedCollateralItem => (
          <StyledRow key={freedCollateralItem.token.address}>
            <StyledSymbolCell>
              {freedCollateralItem.token.symbol}
            </StyledSymbolCell>
            <StyledAmountCell scale={2}>
              {freedCollateralItem.amount}
            </StyledAmountCell>
            <StyledActionCell>
              <Button primary onClick={this.goTo(freedCollateralItem.token)}>
                {t('freed_collateral_list_withdraw')}
              </Button>
            </StyledActionCell>
          </StyledRow>
        ))}
      </div>
    );
  }
}

export default withTranslation()(withRouter(FreedCollateralList));
