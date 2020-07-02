import React, { useCallback, useMemo, useState } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router';
import {
  IDepositRecord,
  ITransaction,
  IToken,
  ViewActions,
  LoadingType,
  useLoadingType,
} from '../stores';
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
import Modal from 'antd/lib/modal';
import { useDispatch } from 'react-redux';
import { BannerType } from '../components/Banner';
import { getTimezone } from '../utils/formatSolidityTime';

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
    history,
    t,
  } = props;

  const dispatch = useDispatch();

  const [poolIdModalVisible, setPoolIdModalVisible] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const showPoolIdModal = useCallback(() => setPoolIdModalVisible(true), []);
  const hidePoolIdModal = useCallback(() => setPoolIdModalVisible(false), []);

  const [earlyWithdrawModalVisible, setEarlyWithdrawModalVisible] = useState(
    false,
  );

  const showEarlyWithdrawModal = useCallback(
    () => setEarlyWithdrawModalVisible(true),
    [],
  );
  const hideEarlyWithdrawModal = useCallback(
    () => setEarlyWithdrawModalVisible(false),
    [],
  );

  const depositToken = useMemo(
    () => tokens.find(token => token.tokenAddress === record.tokenAddress),
    [tokens, record],
  );

  const isEarlyWithdrew = useMemo(
    () =>
      record.withdrewAt.valueOf() !== 0 &&
      record.createdAt
        .add(record.depositTerm.value, 'day')
        .endOf('day')
        .isAfter(record.withdrewAt),
    [record],
  );

  const earlyWithdraw = useCallback(async () => {
    try {
      dispatch(ViewActions.setLoadingType(LoadingType.Withdraw));
      const { depositService } = await getService();
      await depositService.earlyWithdrawDeposit(
        accountAddress,
        record.recordId,
      );
      dispatch(ViewActions.setBanner(t('common_withdraw_deposit_succeed')));
      await reloadRecord();
    } catch (e) {
      dispatch(
        ViewActions.setBanner(
          t('common_withdraw_deposit_fail_title'),
          BannerType.Warning,
          e.message,
        ),
      );
    }
    dispatch(ViewActions.setLoadingType(LoadingType.None));
    hideEarlyWithdrawModal();
  }, [record, accountAddress]);

  const withdraw = useCallback(async () => {
    setIsWithdrawing(true);

    try {
      dispatch(ViewActions.setLoadingType(LoadingType.Withdraw));
      const { depositService } = await getService();
      await depositService.withdrawDeposit(accountAddress, record.recordId);
      dispatch(
        ViewActions.setBanner(t('common_early_withdraw_deposit_succeed')),
      );
      await reloadRecord();
    } catch (e) {
      dispatch(
        ViewActions.setBanner(
          t('common_early_withdraw_deposit_fail_title'),
          BannerType.Warning,
          e.message,
        ),
      );
    }

    setIsWithdrawing(false);
    dispatch(ViewActions.setLoadingType(LoadingType.None));
  }, [record, accountAddress]);

  const APR =
    (Number.parseFloat(convertWeiToDecimal(record.interest)) /
      Number.parseFloat(
        convertWeiToDecimal(
          record.depositAmount,
          4,
          depositToken && depositToken.decimals,
        ),
      ) /
      record.depositTerm.value) *
    365 *
    100;

  const transactionsOfRecord = useMemo(
    () => transactions.filter(tx => tx.recordId === record.recordId),
    [transactions, record],
  );

  const goTo = useCallback(
    () =>
      history.push(
        `/monitor/${record.poolId}?tokenAddress=${record.tokenAddress}`,
      ),
    [record.tokenAddress, record.poolId],
  );

  const loading = useLoadingType();

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
            <span className="primary">
              {convertWeiToDecimal(
                record.depositAmount,
                4,
                depositToken && depositToken.decimals,
              )}{' '}
            </span>
            {depositToken && depositToken.tokenSymbol}
          </TextBox>
        </Col>
        <Col span={12}>
          <TextBox label={t('deposit_detail_label_term')}>
            {t('deposit_detail_text_term', { term: record.depositTerm.value })}
          </TextBox>
        </Col>
      </Row>
      <Row>
        {!record.isWithdrawn && (
          <Col span={12}>
            <TextBox label={t('deposit_detail_label_current_apr')}>
              {APR.toFixed(2)}%
            </TextBox>
          </Col>
        )}
        <Col span={12}>
          <TextBox
            label={
              record.isWithdrawn
                ? t('deposit_detail_label_interest_earned')
                : t('deposit_detail_label_estimated_interest')
            }
          >
            {isEarlyWithdrew
              ? '0.0000'
              : convertWeiToDecimal(
                  record.interest,
                  4,
                  depositToken && depositToken.decimals,
                )}{' '}
            {depositToken && depositToken.tokenSymbol}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <TextBox
            label={`${t(
              'deposit_detail_label_maturity_date',
            )} (${getTimezone()})`}
          >
            {dayjs
              .utc(getTimestampByPoolId(record.poolId))
              .local()
              .format('YYYY.MM.DD HH:mm')}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={24} className="pool-link">
          <span onClick={goTo} style={{ cursor: 'pointer' }}>
            {t('deposit_detail_text_pool', { poolId: record.poolId })}
          </span>
          <Icon
            type="question-circle"
            theme="filled"
            onClick={showPoolIdModal}
          />
        </Col>
      </Row>
      {!record.isWithdrawn && (
        <Row style={{ marginTop: '40px' }}>
          <Col span={24}>
            {record.isMatured ? (
              <Button
                block
                size="large"
                onClick={withdraw}
                loading={isWithdrawing}
                disabled={isWithdrawing}
              >
                {isWithdrawing
                  ? t('common_loading_withdraw')
                  : t('deposit_detail_button_withdraw')}
              </Button>
            ) : (
              <Button block size="large" onClick={showEarlyWithdrawModal}>
                {t('deposit_detail_button_early_withdraw')}
              </Button>
            )}
          </Col>
        </Row>
      )}
      <TransactionList
        tokens={tokens}
        record={record}
        transactions={transactionsOfRecord}
      />
      <Modal
        title={t('deposit_detail_modal_early_withdraw')}
        visible={earlyWithdrawModalVisible}
        closable={false}
        footer={
          record.isEarlyWithdrawable ? (
            <Row className="btn-group" gutter={10}>
              <Col span={12}>
                <Button
                  size="large"
                  block
                  key="early-withdraw-btn-cancel"
                  onClick={hideEarlyWithdrawModal}
                >
                  {t('deposit_detail_modal_cancel')}
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  type="primary"
                  size="large"
                  block
                  key="early-withdraw-btn-confirm"
                  loading={loading === LoadingType.Withdraw}
                  onClick={earlyWithdraw}
                >
                  {t('deposit_detail_modal_early_withdraw')}
                </Button>
              </Col>
            </Row>
          ) : (
            <Button
              size="large"
              block
              type="primary"
              key="early-withdraw-btn-cancel"
              onClick={hideEarlyWithdrawModal}
            >
              {t('deposit_detail_modal_close')}
            </Button>
          )
        }
      >
        <p>
          {record.isEarlyWithdrawable
            ? t('deposit_detail_modal_early_withdraw_confirm_content', {
                amount: convertWeiToDecimal(record.depositAmount),
                unit: depositToken && depositToken.tokenSymbol,
              })
            : t('deposit_detail_modal_early_withdraw_reject_content')}
        </p>
      </Modal>
      <Modal
        title={t('deposit_detail_modal_pool_id')}
        visible={poolIdModalVisible}
        closable={false}
        footer={
          <Button type="primary" size="large" block onClick={hidePoolIdModal}>
            {t('deposit_detail_modal_close')}
          </Button>
        }
      >
        <p>{t('deposit_detail_modal_content')}</p>
      </Modal>
    </div>
  );
};

export default withTranslation()(withRouter(DepositDetail));
