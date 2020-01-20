import React, { useMemo, useCallback } from 'react';
import { IPool } from '../stores';
import { WithTranslation, withTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router';
import Card from 'antd/lib/card';
import { Row, Col } from 'antd/lib/grid';
import { convertWeiToDecimal } from '../utils/BigNumber';
import TextBox from '../components/TextBox';

interface IProps extends WithTranslation, RouteComponentProps {
  pool: IPool;
  onClick: (pool: IPool) => void;
}

const MonitorPoolCard = (props: IProps) => {
  const { pool, onClick, t } = props;

  const title = useMemo(
    () => (
      <div className="monitor-pool-card__title">
        <div className="term">
          {t('monitor_pool_card_title', { poolId: pool.poolId })}
        </div>
      </div>
    ),
    [pool],
  );

  const onCardClick = useCallback(() => onClick(pool), [pool, onClick]);

  return (
    <Card
      className="monitor-pool-card"
      title={title}
      bordered={false}
      onClick={onCardClick}
    >
      <Row>
        <Col span={12}>
          <TextBox label={t('monitor_pool_card_label_total_deposit')}>
            {convertWeiToDecimal(pool.totalDeposit)}
          </TextBox>
        </Col>
        <Col span={12}>
          <TextBox label={t('monitor_pool_card_label_available_amount')}>
            {convertWeiToDecimal(pool.availableAmount)}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <TextBox label={t('monitor_pool_card_label_loan_interest')}>
            {convertWeiToDecimal(pool.loanInterest)}
          </TextBox>
        </Col>
        <Col span={12}>
          <TextBox label={t('monitor_pool_card_label_total_deposit_weight')}>
            {convertWeiToDecimal(pool.totalDepositWeight)}
          </TextBox>
        </Col>
      </Row>
    </Card>
  );
};

export default withTranslation()(withRouter(MonitorPoolCard));
