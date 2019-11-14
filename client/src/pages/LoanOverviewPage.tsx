import React, { useState, useCallback, Fragment } from 'react';
import styled from 'styled-components';
import { WithTranslation, withTranslation } from 'react-i18next';
import { calculateRate } from '../utils/interestRateCalculateHelper';
import { ThemedProps } from '../styles/themes';
import Radio from '../components/common/Radio';
import Card from '../components/common/Card';
import Button from '../components/html/Button';
import { RouteComponentProps, withRouter } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { IState, ILoanPair, CommonActions, IToken, ITerm } from '../stores';
import { BigNumber } from '../utils/BigNumber';
import { useComponentMounted } from '../utils/useEffectAsync';
import { getService } from '../services';

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

interface IProps extends WithTranslation, RouteComponentProps {}

const LoanOverviewPage = (props: IProps) => {
  const { t } = props;
  const dispatch = useDispatch();

  // Selectors
  const defaultAccount = useSelector<IState, string>(
    state => state.account.accounts[0],
  );

  const loanTerms = useSelector<IState, ITerm[]>(state =>
    state.common.loanTerms
      .map((bigNumber: BigNumber) => ({ value: bigNumber.toString() }))
      .map(({ value }: { value: string }) => ({
        text: `${value}-Day`,
        value: Number.parseInt(value, 10),
      })),
  );

  const availableLoanPairs = useSelector<IState, ILoanPair[]>(
    state => state.common.availableLoanPairs,
  );

  const availableLoanTokens = availableLoanPairs.map(
    (loanPair: ILoanPair) => loanPair.loanToken,
  );

  const protocolContractAddress = useSelector<IState, string>(
    state => state.common.protocolContractAddress,
  );

  // Initialize

  useComponentMounted(async () => {
    const { commonService } = await getService();

    const loanPairs = await commonService.getLoanAndCollateralTokenPairs();
    dispatch(CommonActions.setAvailableLoanPairs(loanPairs));
  });

  // States
  const [selectedTerm, setSelectedTerm] = useState();

  // Callbacks
  const onTermSelect = useCallback(
    (value: number) => {
      setSelectedTerm({
        selectedTerm: {
          text: `${value}-Day`,
          value,
        },
      });
    },
    [setSelectedTerm],
  );

  const goTo = useCallback(
    (path: string) => (
      e: React.MouseEvent<HTMLTableRowElement | HTMLButtonElement, MouseEvent>,
    ) => {
      e.stopPropagation();
      props.history.push(path);
    },
    availableLoanTokens,
  );

  const onEnableToken = useCallback(
    (token: IToken) => async (
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    ) => {
      const { commonService } = await getService();
      e.stopPropagation();
      await commonService.approveFullAllowance(
        defaultAccount,
        token,
        protocolContractAddress,
      );
    },
    [availableLoanTokens],
  );

  const renderActions = useCallback(
    (loanToken: IToken, collateralToken: IToken, defaultTerm: number) => {
      const allowanceValid = loanToken.allowance
        ? !loanToken.allowance.isZero()
        : false;
      if (allowanceValid) {
        return (
          <Fragment>
            <StyledButton
              primary
              onClick={goTo(
                `/loan?loanTokenAddress=${loanToken.tokenAddress}&collateralTokenAddress=${collateralToken.tokenAddress}&term=${defaultTerm}`,
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
    availableLoanPairs,
  );

  return (
    <Card>
      <StyledActionBar>
        <StyledTermSelector>
          {t('select_term')}:
          <Radio
            name="term"
            onChange={onTermSelect}
            selectedOption={selectedTerm}
            options={loanTerms}
          />
        </StyledTermSelector>
      </StyledActionBar>
      <StyledTokenList>
        <thead>
          <tr>
            <th style={{ minWidth: '220px' }}>{t('asset')}</th>
            <th style={{ minWidth: '240px' }}>{t('loan_apr')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {availableLoanPairs.map(loanPair => (
            <StyledTokenListRow
              key={loanPair.loanToken.tokenSymbol}
              onClick={goTo(
                `/records/loan?currentToken=${loanPair.loanToken.tokenSymbol}`,
              )}
            >
              <td>{loanPair.loanToken.tokenSymbol}</td>
              <td>{calculateRate(loanPair.annualPercentageRate)}</td>
              <td>
                {renderActions(
                  loanPair.loanToken,
                  loanPair.collateralToken,
                  loanTerms[0].value,
                )}
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
