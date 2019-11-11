import React, { useState, useCallback, Fragment } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import styled from 'styled-components';
import { ThemedProps } from '../styles/themes';
import Button from '../components/html/Button';
import { RouteComponentProps, withRouter } from 'react-router';
import { CommonActions, IState, IToken, ITerm } from '../stores';
import Card from '../components/common/Card';
import Radio from '../components/common/Radio';
import { getService } from '../services';
import { useDispatch, useSelector } from 'react-redux';
import { BigNumber } from '../utils/BigNumber';
import { useEffectAsync } from '../utils/useEffectAsync';

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

const DepositOverviewPage = (props: IProps) => {
  const { t } = props;
  const dispatch = useDispatch();

  // Selectors
  const defaultAccount = useSelector<IState, string>(
    state => state.account.accounts[0],
  );

  const availableDepositTokens = useSelector<IState, IToken[]>(
    state => state.common.availableDepositTokens,
  );

  const depositTerms = useSelector<IState, ITerm[]>(state =>
    state.common.depositTerms
      .map((bigNumber: BigNumber) => ({ value: bigNumber.toString() }))
      .map(({ value }: { value: string }) => ({
        text: `${value}-Day`,
        value: Number.parseInt(value, 10),
      })),
  );

  // Initialize
  useEffectAsync(async () => {
    const { commonService } = await getService();

    const depositTokens = await commonService.getDepositTokens();
    dispatch(CommonActions.setAvailableDepositTokens(depositTokens));

    const allowance = await Promise.all(
      depositTokens.map(async (token: IToken) => ({
        tokenAddress: token.tokenAddress,
        allowance: await commonService.getTokenAllowance(
          defaultAccount,
          token.tokenAddress,
        ),
      })),
    );
    dispatch(CommonActions.setAllowance(allowance));
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
    availableDepositTokens,
  );

  const onEnableToken = useCallback(
    (token: IToken) => async (
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    ) => {
      const { commonService } = await getService();
      e.stopPropagation();
      await commonService.approveFullAllowance(defaultAccount, token);
    },
    [availableDepositTokens],
  );

  const renderActions = useCallback((token: IToken) => {
    const allowanceValid = token.allowance ? !token.allowance.isZero() : false;
    if (allowanceValid) {
      return (
        <Fragment>
          <StyledButton
            primary
            onClick={goTo(`/deposit/${token.tokenAddress}`)}
          >
            {t('deposit')}
          </StyledButton>
        </Fragment>
      );
    } else {
      return (
        <Fragment>
          <StyledButton primary onClick={onEnableToken(token)}>
            {t('enable')}
          </StyledButton>
        </Fragment>
      );
    }
  }, availableDepositTokens);

  return (
    <div>
      <Card>
        <StyledActionBar>
          <StyledTermSelector>
            {t('select_term')}:
            <Radio
              name="term"
              onChange={onTermSelect}
              selectedOption={selectedTerm}
              options={depositTerms}
            />
          </StyledTermSelector>
        </StyledActionBar>
        <StyledTokenList>
          <thead>
            <tr>
              <th style={{ minWidth: '220px' }}>{t('asset')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr>
              {useSelector<IState, IToken[]>(
                state => state.common.availableDepositTokens,
              ).map(token => (
                <StyledTokenListRow
                  key={token.tokenSymbol}
                  onClick={goTo(
                    `/records/deposit?currentToken=${token.tokenAddress}`,
                  )}
                >
                  <td>{token.tokenSymbol}</td>
                  <td>{renderActions(token)}</td>
                </StyledTokenListRow>
              ))}
            </tr>
          </tbody>
        </StyledTokenList>
      </Card>
    </div>
  );
};

export default withTranslation()(withRouter(DepositOverviewPage));
