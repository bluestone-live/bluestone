import React, { useMemo } from 'react';
import RepayForm from '../containers/RepayForm';
import {
  useDefaultAccount,
  useLoanRecords,
  useLoanPairs,
  IState,
} from '../stores';
import { RouteComponentProps, withRouter } from 'react-router';
import { useSelector } from 'react-redux';

const RepayFormPage = (props: RouteComponentProps<{ recordId: string }>) => {
  const {
    match: {
      params: { recordId },
    },
  } = props;

  const accountAddress = useDefaultAccount();

  const records = useLoanRecords();

  const loanPairs = useLoanPairs();

  const protocolContractAddress = useSelector<IState, string>(
    state => state.common.protocolContractAddress,
  );

  const record = useMemo(() => records.find(r => r.recordId === recordId), [
    records,
    recordId,
  ]);

  const selectedLoanPair = useMemo(() => {
    if (record) {
      return loanPairs.find(
        pair =>
          pair.loanToken.tokenAddress === record.loanTokenAddress &&
          pair.collateralToken.tokenAddress === record.collateralTokenAddress,
      );
    }
  }, [record, loanPairs]);

  return (
    <div className="repay-form-page">
      {record && selectedLoanPair && (
        <RepayForm
          accountAddress={accountAddress}
          protocolContractAddress={protocolContractAddress}
          record={record}
          selectedLoanPair={selectedLoanPair}
        />
      )}
    </div>
  );
};

export default withRouter(RepayFormPage);
