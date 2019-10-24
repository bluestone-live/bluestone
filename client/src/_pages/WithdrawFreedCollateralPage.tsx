import React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import WithdrawFreedCollateralForm from '../_containers/WithdrawFreedCollateralForm';
import { useSelector } from 'react-redux';
import { IState, IToken, IFreedCollateral } from '../_stores';

interface IProps extends RouteComponentProps<{ tokenAddress: string }> {}

const WithdrawFreedCollateralPage = (props: IProps) => {
  const {
    match: {
      params: { tokenAddress },
    },
  } = props;

  // Selector
  const accountAddress = useSelector<IState, string>(
    state => state.account.accounts[0],
  );

  const isUserActionsLocked = useSelector<IState, boolean>(
    state => state.common.isUserActionsLocked,
  );

  const tokens = useSelector<IState, IToken[]>(
    state => state.common.availableDepositTokens,
  );

  const freedCollaterals = useSelector<IState, IFreedCollateral[]>(
    state => state.account.freedCollaterals,
  );

  // Computed
  const token = tokens.find(t => t.tokenAddress === tokenAddress);

  // TODO: show placeholder when token is invalid
  return token ? (
    <WithdrawFreedCollateralForm
      accountAddress={accountAddress}
      token={token}
      freedCollaterals={freedCollaterals}
      isUserActionsLocked={isUserActionsLocked}
    />
  ) : null;
};

export default withRouter(WithdrawFreedCollateralPage);
