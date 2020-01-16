import React, { useMemo, useCallback } from 'react';
import DepositDetail from '../containers/DepositDetail';
import { RouteComponentProps } from 'react-router';
import {
  useDepositRecords,
  useTransactions,
  useDefaultAccount,
  useDepositTokens,
  DepositActions,
  TransactionActions,
} from '../stores';
import { useComponentMounted } from '../utils/useEffectAsync';
import { getService } from '../services';
import { useDispatch } from 'react-redux';

const DepositDetailPage = (
  props: RouteComponentProps<{ recordId: string }>,
) => {
  const {
    match: {
      params: { recordId },
    },
  } = props;

  const dispatch = useDispatch();

  const accountAddress = useDefaultAccount();

  const tokens = useDepositTokens();

  const depositRecords = useDepositRecords();

  const transactions = useTransactions();

  const record = useMemo(
    () => depositRecords.find(r => r.recordId === recordId),
    [depositRecords, recordId],
  );

  const reloadRecord = useCallback(async () => {
    const { depositService, transactionService } = await getService();

    dispatch(
      DepositActions.UpdateDepositRecord(
        await depositService.getDepositRecordById(recordId),
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
      {record && (
        <DepositDetail
          tokens={tokens}
          accountAddress={accountAddress}
          record={record}
          transactions={transactions}
          reloadRecord={reloadRecord}
        />
      )}
    </div>
  );
};

export default DepositDetailPage;
