import React, { useMemo } from 'react';
import { IPool } from '../stores';
import Card from 'antd/lib/card';
import { Row, Col } from 'antd/lib/grid';
import TextBox from './TextBox';
import { withTranslation, WithTranslation } from 'react-i18next';

interface IProps extends WithTranslation {
  pool: IPool;
  isMostBorrowed: boolean;
  highlightColumn?: string;
}

const DepositPoolCard = (props: IProps) => {
  const { pool, isMostBorrowed, highlightColumn, t } = props;

  const title = useMemo(
    () => (
      <div className="deposit-pool-card__title">
        <div className="term">
          {t('deposit_pool_card_term', { term: pool.term })}
        </div>
        {isMostBorrowed && <div className="status">MOST BORROWED</div>}
      </div>
    ),
    [pool.term, isMostBorrowed],
  );

  return (
    <Card className="deposit-pool-card" title={title} bordered={false}>
      <Row>
        <Col span={8}>
          <TextBox label={t('deposit_pool_card_text_apr')}>
            <span
              className={highlightColumn === 'APR' ? 'highlight' : undefined}
            >
              {pool.APR}%
            </span>
          </TextBox>
        </Col>
        <Col span={8}>
          <TextBox label={t('deposit_pool_card_text_total_deposit')}>
            <span
              className={
                highlightColumn === 'totalDeposit' ? 'highlight' : undefined
              }
            >
              {pool.totalDeposit}
            </span>
          </TextBox>
        </Col>
        <Col span={8}>
          <TextBox label={t('deposit_pool_card_text_utilization')}>
            <span
              className={
                highlightColumn === 'utilization' ? 'highlight' : undefined
              }
            >
              {pool.utilization}%
            </span>
          </TextBox>
        </Col>
      </Row>
    </Card>
  );
};

export default withTranslation()(DepositPoolCard);
