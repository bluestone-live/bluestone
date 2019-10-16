import * as React from 'react';
import Card from '../components/common/Card';
import { Row, Cell } from '../components/common/Layout';
import FreedCollateralList from '../_containers/FreedCollateralList';
import { useEffectAsync } from '../utils/useEffectAsync';
import { getService } from '../services';
import { useSelector } from 'react-redux';
import { IState, IFreedCollateral, AccountActions, IToken } from '../_stores';

export default () => {
  // Selector
  const defaultAccount = useSelector<IState, string>(
    state => state.account.accounts[0],
  );

  const freedCollaterals = useSelector<IState, IFreedCollateral[]>(
    state => state.account.freedCollaterals,
  );

  const tokens = useSelector<IState, IToken[]>(
    state => state.common.availableDepositTokens,
  );

  // Initialize
  useEffectAsync(async () => {
    const { accountService } = await getService();

    AccountActions.setFreedCollaterals(
      await accountService.getFreedCollaterals(defaultAccount),
    );
  });

  return (
    <Row>
      <Cell>{/* Statistics placeholder*/}</Cell>
      <Cell>
        <Card>
          <FreedCollateralList
            freedCollaterals={freedCollaterals}
            tokens={tokens}
          />
        </Card>
      </Cell>
    </Row>
  );
};
