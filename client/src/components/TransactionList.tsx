import React, { useCallback, useState } from 'react';
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
import Icon from 'antd/lib/icon';

interface IProps extends WithTranslation {
  tokens: IToken[];
  record: IRecord;
  transactions: ITransaction[];
}

const TransactionList = (props: IProps) => {
  const { tokens, record, transactions, t } = props;

  const [showList, setShowList] = useState(true);

  const toggleShowList = useCallback(() => {
    setShowList(!showList);
  }, [showList]);

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
            amount: convertWeiToDecimal(tx.amount, 2),
            unit: collateralToken ? collateralToken.tokenSymbol : '',
          });
        }
        return t(`transaction_list_event_${tx.event}`, {
          amount: convertWeiToDecimal(tx.amount, 2),
          unit: loanToken ? loanToken.tokenSymbol : '',
        });
      }
    },
    [record, transactions],
  );

  return (
    <div className="transaction-list">
      <div className="head" onClick={toggleShowList}>
        {showList ? <Icon type="caret-down" /> : <Icon type="caret-right" />}
        {t('transaction_list_title_transactions', {
          count: transactions.length,
        })}
      </div>
      {showList &&
        transactions.map(tx => (
          <Row key={tx.transactionHash} className="transaction-item">
            <Col span={12}>
              {dayjs(Number.parseInt(tx.time.toString(), 10) * 1000).format(
                'YYYY-MM-DD HH:mm',
              )}
            </Col>
            <Col span={12}>{txDescription(tx)}</Col>
          </Row>
        ))}
    </div>
  );
};

export default withTranslation()(TransactionList);
