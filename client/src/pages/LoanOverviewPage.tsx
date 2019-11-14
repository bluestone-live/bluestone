import React, { useCallback, Fragment } from 'react';
import styled from 'styled-components';
import { WithTranslation, withTranslation } from 'react-i18next';
import { calculateRate } from '../utils/interestRateCalculateHelper';
import { ThemedProps } from '../styles/themes';
import Card from '../components/common/Card';
import Button from '../components/html/Button';
import { RouteComponentProps, withRouter } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import {
  IState,
  ILoanPair,
  IToken,
  useDefaultAccount,
  useLoanPairs,
  useDepositTokens,
  CommonActions,
} from '../stores';
import { getService } from '../services';
import { useDepsUpdated } from '../utils/useEffectAsync';

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

const StyledButton = styled(Button)`
  margin: 0 ${(props: ThemedProps) => props.theme.gap.small};
`;

interface IProps extends WithTranslation, RouteComponentProps {}

const LoanOverviewPage = (props: IProps) => {
  const { t } = props;
  const dispatch = useDispatch();

  // Selectors
  const defaultAccount = useDefaultAccount();
  const depositTokens = useDepositTokens();

  const loanPairs = useLoanPairs();

  const protocolContractAddress = useSelector<IState, string>(
    state => state.common.protocolContractAddress,
  );

  // Initialize
  useDepsUpdated(async () => {
    if (loanPairs) {
      const { commonService } = await getService();

      loanPairs.forEach(async pair => {
        if (pair.maxLoanTerm) {
          dispatch(
            CommonActions.setLoanAPR(
              pair.loanToken.tokenAddress,
              await commonService.getLoanInterestRate(
                pair.loanToken.tokenAddress,
                pair.maxLoanTerm,
              ),
            ),
          );
        }
      });
    }
  }, [loanPairs.length]);

  // Callback
  const goTo = useCallback(
    (path: string) => (
      e: React.MouseEvent<HTMLTableRowElement | HTMLButtonElement, MouseEvent>,
    ) => {
      e.stopPropagation();
      props.history.push(path);
    },
    [],
  );

  const onEnableToken = useCallback(
    (collateralToken: IToken) => async (
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    ) => {
      e.stopPropagation();
      const { commonService } = await getService();
      await commonService.approveFullAllowance(
        defaultAccount,
        collateralToken,
        protocolContractAddress,
      );
      dispatch(
        CommonActions.setAllowance({
          tokenAddress: collateralToken.tokenAddress,
          allowanceAmount: await commonService.getTokenAllowance(
            collateralToken,
            defaultAccount,
            protocolContractAddress,
          ),
        }),
      );
    },
    [protocolContractAddress],
  );

  const renderActions = useCallback(
    (loanToken: IToken, collateralToken: IToken) => {
      const token = depositTokens.find(
        depositToken => loanToken.tokenAddress === depositToken.tokenAddress,
      );

      const allowanceValid =
        token && token.allowance ? !token.allowance.isZero() : false;
      if (allowanceValid) {
        return (
          <Fragment>
            <StyledButton
              primary
              onClick={goTo(
                `/loan?loanTokenAddress=${loanToken.tokenAddress}&collateralTokenAddress=${collateralToken.tokenAddress}`,
              )}
            >
              {t('loan')}
            </StyledButton>
          </Fragment>
        );
      } else {
        return (
          <Fragment>
            <StyledButton primary onClick={onEnableToken(loanToken)}>
              {t('enable')}
            </StyledButton>
          </Fragment>
        );
      }
    },
    [protocolContractAddress, depositTokens],
  );

  return (
    <Card>
      <StyledTokenList>
        <thead>
          <tr>
            <th style={{ minWidth: '220px' }}>{t('asset')}</th>
            <th style={{ minWidth: '240px' }}>{t('loan_apr')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {loanPairs.map((loanPair: ILoanPair) => (
            <StyledTokenListRow
              key={
                loanPair.loanToken.tokenAddress +
                loanPair.collateralToken.tokenAddress
              }
              onClick={goTo(
                `/records/loan?currentToken=${loanPair.loanToken.tokenSymbol}`,
              )}
            >
              <td>
                {loanPair.collateralToken.tokenSymbol} ->{' '}
                {loanPair.loanToken.tokenSymbol}
              </td>
              <td>{calculateRate(loanPair.annualPercentageRate)}</td>
              <td>
                {renderActions(loanPair.loanToken, loanPair.collateralToken)}
              </td>
            </StyledTokenListRow>
          ))}
          <tr />
        </tbody>
      </StyledTokenList>
    </Card>
  );
};

export default withTranslation()(withRouter(LoanOverviewPage));
