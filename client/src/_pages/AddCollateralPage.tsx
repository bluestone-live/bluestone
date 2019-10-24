import React from 'react';
import AddCollateralForm from '../_containers/AddCollateralForm';
import { useSelector } from 'react-redux';
import {
  IState,
  ILoanRecord,
  IFreedCollateral,
  IToken,
  AccountActions,
} from '../_stores';
import { RouteComponentProps, withRouter } from 'react-router';
import { useEffectAsync } from '../utils/useEffectAsync';
import { getService } from '../services';

interface IProps extends RouteComponentProps<{ recordId: string }> {}

const AddCollateralPage = (props: IProps) => {
  const {
    match: {
      params: { recordId },
    },
  } = props;

  // Selector
  const accountAddress = useSelector<IState, string>(
    state => state.account.accounts[0],
  );

  const record = useSelector<IState, ILoanRecord>(state =>
    state.loan.loanRecords.find(
      (loanRecord: ILoanRecord) => loanRecord.recordId === recordId,
    ),
  );

  const freedCollaterals = useSelector<IState, IFreedCollateral[]>(
    state => state.account.freedCollaterals,
  );

  const isUserActionsLocked = useSelector<IState, boolean>(
    state => state.common.isUserActionsLocked,
  );

  const tokens = useSelector<IState, IToken[]>(
    state => state.common.availableDepositTokens,
  );

  // Initialize
  useEffectAsync(async () => {
    const { accountService } = await getService();

    AccountActions.setFreedCollaterals(
      await accountService.getFreedCollaterals(accountAddress),
    );
  });

  return (
    <AddCollateralForm
      accountAddress={accountAddress}
      record={record}
      freedCollaterals={freedCollaterals}
      isUserActionsLocked={isUserActionsLocked}
      tokens={tokens}
    />
  );
};

export default withRouter(AddCollateralPage);
