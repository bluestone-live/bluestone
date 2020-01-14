import React, { useMemo, useCallback } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router';
import { IDepositRecord, IPool, ITransaction, IToken } from '../stores';
import RecordStatus from '../components/RecordStatus';
import { Row, Col } from 'antd/lib/grid';
import TextBox from '../components/TextBox';
import { convertWeiToDecimal } from '../utils/BigNumber';
import Icon from 'antd/lib/icon';
import Button from 'antd/lib/button';
import { getService } from '../services';
import TransactionList from '../components/TransactionList';

interface IProps extends WithTranslation, RouteComponentProps {
  accountAddress: string;
  tokens: IToken[];
  record: IDepositRecord;
  pools: IPool[];
  transactions: ITransaction[];
}

const DepositDetail = (props: IProps) => {
  const { accountAddress, tokens, record, pools, transactions, t } = props;

  const pool = useMemo(
    () =>
      pools.find(
        p =>
          p.poolId === record.poolId && p.tokenAddress === record.tokenAddress,
      ),
    [record, pools],
  );

  const earlyWithdraw = useCallback(async () => {
    const { depositService } = await getService();
    await depositService.earlyWithdrawDeposit(accountAddress, record.recordId);
  }, [record, accountAddress]);

  const withdraw = useCallback(async () => {
    const { depositService } = await getService();
    await depositService.withdrawDeposit(accountAddress, record.recordId);
  }, [record, accountAddress]);

  return (
    <div className="deposit-detail">
      <Row>
        <Col span="24">
          <RecordStatus record={record} />
        </Col>
      </Row>
      <Row>
        <Col span="12">
          <TextBox label={t('deposit_detail_label_amount')}>
            {convertWeiToDecimal(record.depositAmount)}
          </TextBox>
        </Col>
        <Col span="12">
          <TextBox label={t('deposit_detail_label_term')}>
            {t('deposit_detail_text_term', { term: record.depositTerm.value })}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span="12">
          <TextBox label={t('deposit_detail_label_current_apr')}>
            {pool && convertWeiToDecimal(pool.APR)}
          </TextBox>
        </Col>
        <Col span="12">
          <TextBox label={t('deposit_detail_label_estimated_interest')}>
            {convertWeiToDecimal(record.interest)}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span="24">
          <TextBox label={t('deposit_detail_label_maturity_date')}>
            {record.createdAt + record.depositTerm.value}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span="24" className="pool-link">
          {t('deposit_detail_text_pool', { poolId: record.poolId })}
          <Icon type="question-circle" theme="filled" />
        </Col>
      </Row>
      <Row style={{ marginTop: '40px' }}>
        <Col span="24">
          {record.isEarlyWithdrawable ? (
            <Button block size="large" onClick={earlyWithdraw}>
              {t('deposit_detail_button_early_withdraw')}
            </Button>
          ) : (
            <Button block size="large" onClick={withdraw}>
              {t('deposit_detail_button_withdraw')}
            </Button>
          )}
        </Col>
      </Row>
      <TransactionList
        tokens={tokens}
        record={record}
        transactions={transactions}
      />
    </div>
  );
};

export default withTranslation()(withRouter(DepositDetail));
