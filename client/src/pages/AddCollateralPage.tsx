import React from 'react';
import AddCollateralForm from '../containers/AddCollateralForm';
import { useSelector, useDispatch } from 'react-redux';
import {
  IState,
  ILoanRecord,
  AccountActions,
  useDefaultAccount,
  useUserActionLock,
  useDepositTokens,
  LoanActions,
  useAvailableCollaterals,
} from '../stores';
import { RouteComponentProps, withRouter } from 'react-router';
import { useComponentMounted, useDepsUpdated } from '../utils/useEffectAsync';
import { getService } from '../services';

interface IProps extends RouteComponentProps<{ recordId: string }> {}

const AddCollateralPage = (props: IProps) => {
  const {
    match: {
      params: { recordId },
    },
  } = props;
  const dispatch = useDispatch();

  // Selector
  const accountAddress = useDefaultAccount();

  const loanRecords = useSelector<IState, ILoanRecord[]>(
    state => state.loan.loanRecords,
  );

  const record = loanRecords.find(r => r.recordId === recordId);

  const availableCollaterals = useAvailableCollaterals();

  const isUserActionsLocked = useUserActionLock();

  const depositTokens = useDepositTokens();

  // Initialize
  useComponentMounted(async () => {
    const { accountService } = await getService();

    AccountActions.setAvailableCollaterals(
      await accountService.getAvailableCollaterals(accountAddress),
    );
  });

  useDepsUpdated(async () => {
    const { loanService } = await getService();
    if (recordId) {
      dispatch(
        LoanActions.UpdateLoanRecord(
          recordId,
          await loanService.getLoanRecordById(recordId),
        ),
      );
    }
  }, [recordId]);

  useDepsUpdated(async () => {
    const { accountService } = await getService();

    if (accountAddress) {
      dispatch(
        AccountActions.setAvailableCollaterals(
          await accountService.getAvailableCollaterals(accountAddress),
        ),
      );
    }
  }, [accountAddress]);

  return (
    <AddCollateralForm
      accountAddress={accountAddress}
      record={record}
      availableCollaterals={availableCollaterals}
      isUserActionsLocked={isUserActionsLocked}
      tokens={depositTokens}
    />
  );
};

export default withRouter(AddCollateralPage);
