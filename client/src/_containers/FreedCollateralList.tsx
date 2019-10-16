import React, { useCallback } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { Row, Cell } from '../components/common/Layout';
import Button from '../components/html/Button';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';
import { ThemedProps } from '../styles/themes';
import { IFreedCollateral, IToken } from '../_stores';

interface IProps extends WithTranslation, RouteComponentProps {
  freedCollaterals: IFreedCollateral[];
  tokens: IToken[];
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

const FreedCollateralList = (props: IProps) => {
  const { freedCollaterals, tokens, history, t } = props;

  // Callback
  const goTo = useCallback(
    (tokenAddress: string) => () => history.push(`/withdraw/${tokenAddress}`),
    [history],
  );

  const renderFreedCollateralRow = useCallback(
    (freedCollateral: IFreedCollateral) => {
      const collateralToken = tokens.find(
        token => token.tokenAddress === freedCollateral.tokenAddress,
      );
      return (
        <StyledRow key={freedCollateral.tokenAddress}>
          <StyledSymbolCell>
            {collateralToken && collateralToken.tokenSymbol}
          </StyledSymbolCell>
          <StyledAmountCell scale={2}>
            {freedCollateral.amount}
          </StyledAmountCell>
          <StyledActionCell>
            <Button primary onClick={goTo(freedCollateral.tokenAddress)}>
              {t('freed_collateral_list_withdraw')}
            </Button>
          </StyledActionCell>
        </StyledRow>
      );
    },
    [tokens],
  );

  return (
    <div className="freed-collateral-list">
      <StyledPanelHeader>{t('freed_collateral_list_title')}</StyledPanelHeader>
      {freedCollaterals.map(freedCollateral =>
        renderFreedCollateralRow(freedCollateral),
      )}
    </div>
  );
};

export default withTranslation()(withRouter(FreedCollateralList));
