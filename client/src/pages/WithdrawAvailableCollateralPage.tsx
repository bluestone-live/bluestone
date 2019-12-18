import React, { useMemo } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import WithdrawAvailableCollateralForm from '../containers/WithdrawAvailableCollateralForm';
import {
  useAvailableCollaterals,
  useLoanPairs,
  useDefaultAccount,
  AccountActions,
} from '../stores';
import { uniqueBy } from '../utils/uniqueBy';
import { useDepsUpdated } from '../utils/useEffectAsync';
import { useDispatch } from 'react-redux';
import { getService } from '../services';

interface IProps extends RouteComponentProps<{ tokenAddress: string }> {}

const WithdrawAvailableCollateralPage = (props: IProps) => {
  const {
    match: {
      params: { tokenAddress },
    },
  } = props;

  const dispatch = useDispatch();

  // Selector
  const accountAddress = useDefaultAccount();

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

  const availableCollaterals = useAvailableCollaterals();

  // Initialize
  useDepsUpdated(async () => {
    const { accountService } = await getService();

    if (accountAddress) {
      dispatch(
        AccountActions.setAvailableCollaterals(
          await accountService.getAvailableCollaterals(accountAddress),
        ),
      );
    }
  }, [accountAddress, collateralTokens]);

  // Computed
  const token = collateralTokens.find(t => t.tokenAddress === tokenAddress);

  // TODO: show placeholder when token is invalid
  return token ? (
    <WithdrawAvailableCollateralForm
      accountAddress={accountAddress}
      token={token}
      availableCollaterals={availableCollaterals}
    />
  ) : null;
};

export default withRouter(WithdrawAvailableCollateralPage);
