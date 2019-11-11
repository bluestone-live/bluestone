import React, { useCallback } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { Row, Cell } from '../components/common/Layout';
import Button from '../components/html/Button';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';
import { ThemedProps } from '../styles/themes';
import { IAvailableCollateral, IToken } from '../stores';

interface IProps extends WithTranslation, RouteComponentProps {
  availableCollaterals: IAvailableCollateral[];
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

const AvailableCollateralList = (props: IProps) => {
  const { availableCollaterals, tokens, history, t } = props;

  // Callback
  const goTo = useCallback(
    (tokenAddress: string) => () => history.push(`/withdraw/${tokenAddress}`),
    [history],
  );

  const renderAvailableCollateralRow = useCallback(
    (availableCollateral: IAvailableCollateral) => {
      const collateralToken = tokens.find(
        token => token.tokenAddress === availableCollateral.tokenAddress,
      );
      return (
        <StyledRow key={availableCollateral.tokenAddress}>
          <StyledSymbolCell>
            {collateralToken && collateralToken.tokenSymbol}
          </StyledSymbolCell>
          <StyledAmountCell scale={2}>
            {availableCollateral.amount}
          </StyledAmountCell>
          <StyledActionCell>
            <Button primary onClick={goTo(availableCollateral.tokenAddress)}>
              {t('available_collateral_list_withdraw')}
            </Button>
          </StyledActionCell>
        </StyledRow>
      );
    },
    [tokens],
  );

  return (
    <div className="available-collateral-list">
      <StyledPanelHeader>
        {t('available_collateral_list_title')}
      </StyledPanelHeader>
      {availableCollaterals.map(availableCollateral =>
        renderAvailableCollateralRow(availableCollateral),
      )}
    </div>
  );
};

export default withTranslation()(withRouter(AvailableCollateralList));
