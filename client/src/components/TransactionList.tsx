import React, { useCallback, useState } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  ITransaction,
  IRecord,
  RecordType,
  IDepositRecord,
  IToken,
  ILoanRecord,
  useNetwork,
} from '../stores';
import { Row, Col } from 'antd/lib/grid';
import dayjs from 'dayjs';
import { EventName } from '../utils/MetaMaskProvider';
import {
  convertWeiToDecimal,
  convertDecimalToWei,
  BigNumber,
} from '../utils/BigNumber';
import Icon from 'antd/lib/icon';

interface IProps extends WithTranslation {
  tokens: IToken[];
  record: IRecord;
  transactions: ITransaction[];
}

const TransactionList = (props: IProps) => {
  const { tokens, record, transactions, t } = props;

  const [showList, setShowList] = useState(true);

  const network = useNetwork();

  const toggleShowList = useCallback(() => {
    setShowList(!showList);
  }, [showList]);

  const openNewTab = useCallback(
    (transaction: ITransaction) => () => {
      let txLink;
      switch (network) {
        case 'rinkeby':
          txLink = `https://rinkeby.etherscan.io/tx/${transaction.transactionHash}`;
          break;
        case 'kovan':
          txLink = `https://kovan.etherscan.io/tx/${transaction.transactionHash}`;
          break;
        default:
          txLink = `https://etherscan.io/tx/${transaction.transactionHash}`;
      }
      window.open(txLink, 'lendhoo_tx');
    },
    [transactions, network],
  );

  const txDescription = useCallback(
    (tx: ITransaction) => {
      if (record.recordType === RecordType.Deposit) {
        const depositToken = tokens.find(
          token =>
            token.tokenAddress === (record as IDepositRecord).tokenAddress,
        );
        return t(`transaction_list_event_${tx.event}`, {
          amount: new BigNumber(tx.amount).lt(
            new BigNumber(
              convertDecimalToWei(
                0.0001,
                depositToken ? depositToken!.decimals : undefined,
              ),
            ),
          )
            ? '≈0.0001'
            : convertWeiToDecimal(
                tx.amount,
                4,
                depositToken && depositToken.decimals,
              ),
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

        switch (tx.event) {
          case EventName.AddCollateralSucceed:
          case EventName.SubtractCollateralSucceed:
            return t(`transaction_list_event_${tx.event}`, {
              amount: new BigNumber(tx.amount).lt(
                new BigNumber(convertDecimalToWei(0.0001)),
              )
                ? '≈0.0001'
                : convertWeiToDecimal(tx.amount, 4),
              unit: collateralToken ? collateralToken.tokenSymbol : '',
            });
          default:
        }

        let tokenSymbol = '';

        if (loanToken) {
          tokenSymbol = loanToken.tokenSymbol;
        } else if (collateralToken) {
          tokenSymbol = collateralToken.tokenSymbol;
        }

        return t(`transaction_list_event_${tx.event}`, {
          amount: new BigNumber(tx.amount).lt(
            new BigNumber(
              convertDecimalToWei(0.0001, loanToken ? loanToken.decimals : 18),
            ),
          )
            ? `≈0.0001`
            : convertWeiToDecimal(
                tx.amount,
                4,
                loanToken && loanToken.decimals,
              ),
          unit: tokenSymbol,
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
        transactions
          .sort(
            (tx1, tx2) =>
              Number.parseInt(tx2.time.toString(), 10) -
              Number.parseInt(tx1.time.toString(), 10),
          )
          .map(tx => (
            <Row
              key={tx.transactionHash}
              className="transaction-item"
              onClick={openNewTab(tx)}
            >
              <Col span={12}>
                {dayjs
                  .utc(Number.parseInt(tx.time.toString(), 10) * 1000)
                  .local()
                  .format('YYYY-MM-DD HH:mm')}
              </Col>
              <Col span={12}>{txDescription(tx)}</Col>
            </Row>
          ))}
    </div>
  );
};

export default withTranslation()(TransactionList);
