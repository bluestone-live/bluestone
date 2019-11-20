import React, { useMemo } from 'react';
import Card from '../components/common/Card';
import { Row, Cell } from '../components/common/Layout';
import AvailableCollateralList from '../containers/AvailableCollateralList';
import { useDepsUpdated } from '../utils/useEffectAsync';
import { getService } from '../services';
import { useDispatch } from 'react-redux';
import {
  AccountActions,
  useDefaultAccount,
  useAvailableCollaterals,
  useLoanPairs,
  useGeneralStats,
  useTokenStats,
  IGeneralStats,
  IToken,
  ITokenStats,
} from '../stores';
import { uniqueBy } from '../utils/uniqueBy';
import StatisticsList from '../containers/StatisticsList';
import styled from 'styled-components';

const StyledCell = styled(Cell)`
  &:first-child {
    margin-right: 20px;
  }
  &:last-child {
    margin-left: 20px;
  }
`;

export default () => {
  const dispatch = useDispatch();

  const generalStatKeys = useMemo(
    () => ['totalDeposits', 'totalLoans', 'totalDefaults'],
    [],
  );

  const tokenStatKeys = useMemo(
    () => [
      'totalDeposits',
      'totalDepositAmount',
      'totalLoans',
      'totalLoanAmount',
      'totalDefaults',
    ],
    [],
  );

  // Selector
  const accountAddress = useDefaultAccount();

  const availableCollaterals = useAvailableCollaterals();

  const loanPairs = useLoanPairs();

  const collateralTokens = useMemo(
    () =>
      loanPairs
        ? uniqueBy(
            loanPairs.map(loanPair => loanPair.collateralToken),
            'tokenAddress',
          )
        : [],
    [loanPairs],
  );

  const loanTokens = useMemo<IToken[]>(
    () =>
      loanPairs
        ? uniqueBy(
            loanPairs.map(loanPair => loanPair.loanToken),
            'tokenAddress',
          )
        : [],
    [loanPairs],
  );

  const generalStats = useGeneralStats();

  const tokenStats = useTokenStats();

  // Initialize
  useDepsUpdated(async () => {
    const { accountService } = await getService();

    if (accountAddress) {
      dispatch(
        AccountActions.setAvailableCollaterals(
          await accountService.getAvailableCollaterals(accountAddress),
        ),
      );
      generalStatKeys.forEach(async key =>
        dispatch(
          AccountActions.setGeneralStat(
            key as keyof IGeneralStats,
            await accountService.getGeneralStat(accountAddress, key),
          ),
        ),
      );
      loanTokens.forEach(loanToken =>
        tokenStatKeys.forEach(async key =>
          dispatch(
            AccountActions.setTokenStat(
              loanToken,
              key as keyof ITokenStats,
              await accountService.getTokenStat(
                accountAddress,
                loanToken.tokenAddress,
                key,
              ),
            ),
          ),
        ),
      );
    }
  }, [accountAddress, loanTokens]);

  return (
    <Row>
      <StyledCell>
        <Card>
          <StatisticsList
            generalStats={generalStats}
            generalStatKeys={generalStatKeys}
            tokenStats={tokenStats}
            tokenStatKeys={tokenStatKeys}
          />
        </Card>
      </StyledCell>
      <StyledCell>
        <Card>
          <AvailableCollateralList
            availableCollaterals={availableCollaterals}
            collateralTokens={collateralTokens}
          />
        </Card>
      </StyledCell>
    </Row>
  );
};
