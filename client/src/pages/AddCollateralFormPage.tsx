import React, { useMemo, useCallback } from 'react';
import AddCollateralForm from '../containers/AddCollateralForm';
import {
  useDefaultAccount,
  useLoanPairs,
  useLoanRecords,
  IState,
  LoanActions,
} from '../stores';
import { RouteComponentProps } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { getService } from '../services';
import { useComponentMounted } from '../utils/useEffectAsync';

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

  const dispatch = useDispatch();

  const reloadRecord = useCallback(async () => {
    const { loanService } = await getService();

    dispatch(
      LoanActions.UpdateLoanRecord(
        await loanService.getLoanRecordById(recordId),
      ),
    );
  }, []);

  // Initialize
  useComponentMounted(reloadRecord);

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
