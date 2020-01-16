import React, { useCallback, useMemo } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router';
import { IDepositRecord, ITransaction, IToken } from '../stores';
import RecordStatus from '../components/RecordStatus';
import { Row, Col } from 'antd/lib/grid';
import TextBox from '../components/TextBox';
import { convertWeiToDecimal } from '../utils/BigNumber';
import Icon from 'antd/lib/icon';
import Button from 'antd/lib/button';
import { getService } from '../services';
import TransactionList from '../components/TransactionList';
import { getTimestampByPoolId } from '../utils/poolIdCalculator';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';

interface IProps extends WithTranslation, RouteComponentProps {
  accountAddress: string;
  tokens: IToken[];
  record: IDepositRecord;
  transactions: ITransaction[];
  reloadRecord: () => Promise<void>;
}

const DepositDetail = (props: IProps) => {
  const {
    accountAddress,
    tokens,
    record,
    transactions,
    reloadRecord,
    t,
  } = props;

  const earlyWithdraw = useCallback(async () => {
    const { depositService } = await getService();
    await depositService.earlyWithdrawDeposit(accountAddress, record.recordId);
    await reloadRecord();
  }, [record, accountAddress]);

  const withdraw = useCallback(async () => {
    const { depositService } = await getService();
    await depositService.withdrawDeposit(accountAddress, record.recordId);
    await reloadRecord();
  }, [record, accountAddress]);

  const APR =
    (Number.parseFloat(convertWeiToDecimal(record.interest)) /
      Number.parseFloat(convertWeiToDecimal(record.depositAmount))) *
    100;

  const transactionsOfRecord = useMemo(
    () => transactions.filter(tx => tx.recordId === record.recordId),
    [transactions, record],
  );

  return (
    <div className="deposit-detail">
      <Row>
        <Col span={24}>
          <RecordStatus record={record} />
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <TextBox label={t('deposit_detail_label_amount')}>
            {convertWeiToDecimal(record.depositAmount)}
          </TextBox>
        </Col>
        <Col span={12}>
          <TextBox label={t('deposit_detail_label_term')}>
            {t('deposit_detail_text_term', { term: record.depositTerm.value })}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <TextBox label={t('deposit_detail_label_current_apr')}>
            {APR.toFixed(2)}%
          </TextBox>
        </Col>
        <Col span={12}>
          <TextBox label={t('deposit_detail_label_estimated_interest')}>
            {convertWeiToDecimal(record.interest)}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <TextBox label={t('deposit_detail_label_maturity_date')}>
            {dayjs(getTimestampByPoolId(record.poolId)).format(
              'YYYY.MM.DD HH:mm ZZ',
            )}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={24} className="pool-link">
          {t('deposit_detail_text_pool', { poolId: record.poolId })}
          <Icon type="question-circle" theme="filled" />
        </Col>
      </Row>
      <Row style={{ marginTop: '40px' }}>
        <Col span={24}>
          {record.isEarlyWithdrawable && (
            <Button block size="large" onClick={earlyWithdraw}>
              {t('deposit_detail_button_early_withdraw')}
            </Button>
          )}
          {record.isMatured && (
            <Button block size="large" onClick={withdraw}>
              {t('deposit_detail_button_withdraw')}
            </Button>
          )}
        </Col>
      </Row>
      <TransactionList
        tokens={tokens}
        record={record}
        transactions={transactionsOfRecord}
      />
    </div>
  );
};

export default withTranslation()(withRouter(DepositDetail));
