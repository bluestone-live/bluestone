import * as React from 'react';
import Card from '../components/common/Card';
import { Row, Cell } from '../components/common/Layout';
import AvailableCollateralList from '../_containers/AvailableCollateralList';
import { useEffectAsync } from '../utils/useEffectAsync';
import { getService } from '../services';
import { useSelector } from 'react-redux';
import {
  IState,
  IAvailableCollateral,
  AccountActions,
  IToken,
} from '../_stores';

export default () => {
  // Selector
  const defaultAccount = useSelector<IState, string>(
    state => state.account.accounts[0],
  );

  const availableCollaterals = useSelector<IState, IAvailableCollateral[]>(
    state => state.account.availableCollaterals,
  );

  const tokens = useSelector<IState, IToken[]>(
    state => state.common.availableDepositTokens,
  );

  // Initialize
  useEffectAsync(async () => {
    const { accountService } = await getService();

    AccountActions.setAvailableCollaterals(
      await accountService.getAvailableCollaterals(defaultAccount),
    );
  });

  return (
    <Row>
      <Cell>{/* Statistics placeholder*/}</Cell>
      <Cell>
        <Card>
          <AvailableCollateralList
            availableCollaterals={availableCollaterals}
            tokens={tokens}
          />
        </Card>
      </Cell>
    </Row>
  );
};
