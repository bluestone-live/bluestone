import React, { useMemo } from 'react';
import AddCollateralForm from '../containers/AddCollateralForm';
import { useDefaultAccount, useLoanPairs, useLoanRecords } from '../stores';
import { RouteComponentProps } from 'react-router';

const AddCollateralFormPage = (
  props: RouteComponentProps<{ recordId: string }>,
) => {
  const {
    match: {
      params: { recordId },
    },
  } = props;

  const accountAddress = useDefaultAccount();

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
          selectedLoanPair={selectedLoanPair}
          record={record}
        />
      )}
    </div>
  );
};

export default AddCollateralFormPage;
