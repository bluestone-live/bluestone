import React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import RepayLoanForm from '../containers/RepayLoanForm';
import { useSelector, useDispatch } from 'react-redux';
import { IState, ILoanRecord, IToken, LoanActions } from '../stores';
import { useDepsUpdated } from '../utils/useEffectAsync';
import { getService } from '../services';

interface IProps extends RouteComponentProps<{ recordId: string }> {}

const RepayLoanPage = (props: IProps) => {
  const {
    match: {
      params: { recordId },
    },
  } = props;
  const dispatch = useDispatch();

  // Initialize
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

  // Selector
  const accountAddress = useSelector<IState, string>(
    state => state.account.accounts[0],
  );

  const record = useSelector<IState, ILoanRecord>(state =>
    state.loan.loanRecords.find(
      (loanRecord: ILoanRecord) => loanRecord.recordId === recordId,
    ),
  );

  const isUserActionsLocked = useSelector<IState, boolean>(
    state => state.common.isUserActionsLocked,
  );

  const tokens = useSelector<IState, IToken[]>(
    state => state.common.depositTokens,
  );

  return (
    <RepayLoanForm
      accountAddress={accountAddress}
      record={record}
      tokens={tokens}
      isUserActionsLocked={isUserActionsLocked}
    />
  );
};

export default withRouter(RepayLoanPage);
