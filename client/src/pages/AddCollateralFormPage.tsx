import React, { useMemo } from 'react';
import AddCollateralForm from '../containers/AddCollateralForm';
import {
  useDefaultAccount,
  useLoanPairs,
  useLoanRecords,
  IState,
} from '../stores';
import { RouteComponentProps } from 'react-router';
import { useSelector } from 'react-redux';

const AddCollateralFormPage = (
  props: RouteComponentProps<{ recordId: string }>,
) => {
  const {
    match: {
      params: { recordId },
    },
  } = props;

  const accountAddress = useDefaultAccount();

  const protocolContractAddress = useSelector<IState, string>(
    state => state.common.protocolContractAddress,
  );

  const loanPairs = useLoanPairs();

  const loanRecords = useLoanRecords();

  const record = useMemo(() => loanRecords.find(r => r.recordId === recordId), [
    loanRecords,
  ]);

  const selectedLoanPair = useMemo(() => {
    if (record) {
      return loanPairs.find(
        pair =>
          pair.collateralToken.tokenAddress === record.collateralTokenAddress &&
          pair.loanToken.tokenAddress === record.loanTokenAddress,
      );
    }
  }, [loanPairs, record]);

  return (
    <div className="add-collateral-form-page">
      {record && selectedLoanPair && (
        <AddCollateralForm
          accountAddress={accountAddress}
          protocolContractAddress={protocolContractAddress}
          selectedLoanPair={selectedLoanPair}
          record={record}
        />
      )}
    </div>
  );
};

export default AddCollateralFormPage;
