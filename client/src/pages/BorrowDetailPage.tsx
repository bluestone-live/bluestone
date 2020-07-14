import React, { useMemo, useCallback } from 'react';
import { RouteComponentProps } from 'react-router';
import {
  useDefaultAccount,
  useTransactions,
  useLoanRecords,
  useLoanPairs,
  TransactionActions,
  LoanActions,
} from '../stores';
import BorrowDetail from '../containers/BorrowDetail';
import { useComponentMounted } from '../utils/useEffectAsync';
import { useDispatch } from 'react-redux';
import { getService } from '../services';

const BorrowDetailPage = (props: RouteComponentProps<{ recordId: string }>) => {
  const {
    match: {
      params: { recordId },
    },
  } = props;

  const dispatch = useDispatch();

  const accountAddress = useDefaultAccount();

  const loanPairs = useLoanPairs();

  const loanRecords = useLoanRecords();

  const transactions = useTransactions();

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

  const reloadRecord = useCallback(async () => {
    const { loanService, transactionService } = await getService();

    dispatch(
      LoanActions.UpdateLoanRecord(
        await loanService.getLoanRecordById(recordId),
      ),
    );
    dispatch(
      TransactionActions.replaceTransactions(
        await transactionService.getActionTransactions(accountAddress),
      ),
    );
  }, []);

  // Initialize
  useComponentMounted(reloadRecord);

  return (
    <div className="detail-page">
      {record && selectedLoanPair && (
        <BorrowDetail
          transactions={transactions}
          record={record}
          selectedLoanPair={selectedLoanPair}
        />
      )}
    </div>
  );
};

export default BorrowDetailPage;
