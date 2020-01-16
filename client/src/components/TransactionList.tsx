import React, { useMemo, useCallback } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  ITransaction,
  IRecord,
  RecordType,
  IDepositRecord,
  IToken,
  ILoanRecord,
} from '../stores';
import { Row, Col } from 'antd/lib/grid';
import dayjs from 'dayjs';
import { EventName } from '../utils/MetaMaskProvider';
import { convertWeiToDecimal } from '../utils/BigNumber';

interface IProps extends WithTranslation {
  tokens: IToken[];
  record: IRecord;
  transactions: ITransaction[];
}

const TransactionList = (props: IProps) => {
  const { tokens, record, transactions, t } = props;

  const txDescription = useCallback(
    (tx: ITransaction) => {
      if (record.recordType === RecordType.Deposit) {
        const depositToken = tokens.find(
          token =>
            token.tokenAddress === (record as IDepositRecord).tokenAddress,
        );
        return t(`transaction_list_event_${tx.event}`, {
          amount: convertWeiToDecimal(tx.amount, 2),
          unit: depositToken ? depositToken.tokenSymbol : '',
        });
      } else {
        const loanToken = tokens.find(
          token =>
            token.tokenAddress === (record as ILoanRecord).loanTokenAddress,
        );
        const collateralToken = tokens.find(
          token =>
            token.tokenAddress ===
            (record as ILoanRecord).collateralTokenAddress,
        );

        if (tx.event === EventName.AddCollateralSucceed) {
          return t(`transaction_list_event_${tx.event}`, {
            amount: tx.amount,
            unit: collateralToken ? collateralToken.tokenSymbol : '',
          });
        }
        return t(`transaction_list_event_${tx.event}`, {
          amount: tx.amount,
          unit: loanToken ? loanToken.tokenSymbol : '',
        });
      }
    },
    [record, transactions],
  );

  return (
    <div className="transaction-list">
      <div className="head">
        {t('transaction_list_title_transactions', {
          count: transactions.length,
        })}
      </div>
      {transactions.map(tx => (
        <Row key={tx.transactionHash} className="transaction-item">
          <Col span={12}>
            {dayjs(tx.time * 1000).format('YYYY-MM-DD HH:mm')}
          </Col>
          <Col span={12}>{txDescription(tx)}</Col>
        </Row>
      ))}
    </div>
  );
};

export default withTranslation()(TransactionList);
