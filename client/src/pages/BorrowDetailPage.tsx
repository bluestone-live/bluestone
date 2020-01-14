import React, { useMemo } from 'react';
import { RouteComponentProps } from 'react-router';
import {
  useDefaultAccount,
  useTransactions,
  useLoanRecords,
  useLoanPairs,
} from '../stores';
import BorrowDetail from '../containers/BorrowDetail';

const BorrowDetailPage = (props: RouteComponentProps<{ recordId: string }>) => {
  const {
    match: {
      params: { recordId },
    },
  } = props;

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
        pair => pair.loanToken.tokenAddress === record.loanTokenAddress,
      );
    }
  }, [loanPairs, record]);

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
