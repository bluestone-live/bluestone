import React, { useMemo, useCallback, Fragment } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  IDepositRecord,
  ILoanRecord,
  RecordType,
  IPool,
  IRecord,
} from '../stores';
import Card from 'antd/lib/card';
import { Row, Col } from 'antd/lib/grid';
import TextBox from '../components/TextBox';
import { convertWeiToDecimal } from '../utils/BigNumber';
import Icon from 'antd/lib/icon';
import { getCurrentPoolId } from '../utils/poolIdCalculator';

interface IProps extends WithTranslation {
  record: IDepositRecord | ILoanRecord;
  pools: IPool[];
  onClick: (record: IRecord) => void;
}

const RecordCard = (props: IProps) => {
  const { record, pools, onClick, t } = props;

  const dueDate = useMemo(() => {
    if (record.recordType === RecordType.Deposit) {
      const depositRecord = record as IDepositRecord;

      if (depositRecord.isMatured) {
        return (
          <span className="green">{t('record_card_due_date_matured')}</span>
        );
      }
      if (depositRecord.isWithdrawn) {
        return <span className="grey">{t('record_card_due_date_closed')}</span>;
      }
      return (
        <span>
          {t('record_card_due_date_mature_in', {
            day:
              Number.parseInt(depositRecord.poolId || '0', 10) -
              getCurrentPoolId(),
          })}
        </span>
      );
    } else {
      const borrowRecord = record as ILoanRecord;

      if (borrowRecord.isClosed) {
        return <span className="grey">{t('record_card_due_date_closed')}</span>;
      }
      if (borrowRecord.isOverDue) {
        return (
          <span className="yellow">{t('record_card_due_date_overdue')}</span>
        );
      }
      return (
        <span>
          {t('record_card_due_date_due_in', {
            day: borrowRecord.dueAt.diff(borrowRecord.createdAt, 'day'),
          })}
        </span>
      );
    }
  }, [record]);

  const title = useMemo(() => {
    return (
      <div className="record-card-title">
        <div>
          <div className="record-type">
            {record.recordType === RecordType.Deposit
              ? t('record_card_title_deposit')
              : t('record_card_title_borrow')}
          </div>
          <div className="due-date">{dueDate}</div>
        </div>
        <div className="detail-icon">
          <Icon type="right" />
        </div>
      </div>
    );
  }, [dueDate]);

  const content = useMemo(() => {
    if (record.recordType === RecordType.Deposit) {
      const depositRecord = record as IDepositRecord;

      const pool = pools.find(
        p =>
          p.poolId === depositRecord.poolId &&
          p.tokenAddress === depositRecord.tokenAddress,
      );

      return (
        <Fragment>
          <Row style={{ marginBottom: 0 }}>
            <Col span={8} className="ant-form-item-label">
              <label>{t('record_card_label_deposit_amount')}</label>
            </Col>
            <Col span={8} className="ant-form-item-label">
              <label>{t('record_card_label_current_apr')}</label>
            </Col>
            <Col span={8} className="ant-form-item-label">
              <label>{t('record_card_label_estimated_earned')}</label>
            </Col>
          </Row>
          <Row>
            <Col span={8}>
              <span className="ant-form-text">
                {convertWeiToDecimal(depositRecord.depositAmount)}
              </span>
            </Col>
            <Col span={8}>
              <span className="ant-form-text">
                {pool
                  ? Number.parseFloat(convertWeiToDecimal(pool.APR)) * 100
                  : '0.00'}
                %
              </span>
            </Col>
            <Col span={8}>
              <span className="ant-form-text">
                {convertWeiToDecimal(depositRecord.interest)}
              </span>
            </Col>
          </Row>
        </Fragment>
      );
    } else {
      const borrowRecord = record as ILoanRecord;

      return (
        <Row>
          <Col span={12}>
            <TextBox label={t('record_card_label_remaining_debt')}>
              {convertWeiToDecimal(borrowRecord.remainingDebt)}
            </TextBox>
          </Col>
          <Col span={12}>
            <TextBox label={t('record_card_label_collateral_ratio')}>
              {convertWeiToDecimal(borrowRecord.currentCollateralRatio)}
            </TextBox>
          </Col>
        </Row>
      );
    }
  }, [record, pools]);

  const onCardClick = useCallback(() => onClick(record), [record, onClick]);

  return (
    <Card
      className="record-card"
      title={title}
      bordered={false}
      onClick={onCardClick}
    >
      {content}
    </Card>
  );
};

export default withTranslation()(RecordCard);
