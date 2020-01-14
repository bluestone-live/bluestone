import React from 'react';
import DepositDetail from '../containers/DepositDetail';
import { RouteComponentProps } from 'react-router';
import {
  useDepositRecords,
  useAllPools,
  useTransactions,
  useDefaultAccount,
  useDepositTokens,
} from '../stores';

const DepositDetailPage = (
  props: RouteComponentProps<{ recordId: string }>,
) => {
  const {
    match: {
      params: { recordId },
    },
  } = props;

  const accountAddress = useDefaultAccount();

  const tokens = useDepositTokens();

  const depositRecords = useDepositRecords();

  const pools = useAllPools();

  const transactions = useTransactions();

  const record = depositRecords.find(r => r.recordId === recordId);

  return (
    <div className="detail-page">
      {record && (
        <DepositDetail
          tokens={tokens}
          accountAddress={accountAddress}
          record={record}
          pools={pools}
          transactions={transactions}
        />
      )}
    </div>
  );
};

export default DepositDetailPage;
