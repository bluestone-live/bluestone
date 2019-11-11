import React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import WithdrawAvailableCollateralForm from '../containers/WithdrawAvailableCollateralForm';
import { useSelector } from 'react-redux';
import { IState, IToken, IAvailableCollateral } from '../stores';

interface IProps extends RouteComponentProps<{ tokenAddress: string }> {}

const WithdrawAvailableCollateralPage = (props: IProps) => {
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

  const availableCollaterals = useSelector<IState, IAvailableCollateral[]>(
    state => state.account.availableCollaterals,
  );

  // Computed
  const token = tokens.find(t => t.tokenAddress === tokenAddress);

  // TODO: show placeholder when token is invalid
  return token ? (
    <WithdrawAvailableCollateralForm
      accountAddress={accountAddress}
      token={token}
      availableCollaterals={availableCollaterals}
      isUserActionsLocked={isUserActionsLocked}
    />
  ) : null;
};

export default withRouter(WithdrawAvailableCollateralPage);
