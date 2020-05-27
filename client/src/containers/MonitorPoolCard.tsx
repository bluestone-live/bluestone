import React, { useMemo, useCallback } from 'react';
import { IPool, useDepositTokens } from '../stores';
import { WithTranslation, withTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router';
import Card from 'antd/lib/card';
import { Row, Col } from 'antd/lib/grid';
import { convertWeiToDecimal } from '../utils/BigNumber';
import TextBox from '../components/TextBox';
import { getCurrentPoolId } from '../utils/poolIdCalculator';

interface IProps extends WithTranslation, RouteComponentProps {
  pool: IPool;
  onClick: (pool: IPool) => void;
}

const MonitorPoolCard = (props: IProps) => {
  const { pool, onClick, t } = props;

  const currentPoolId = getCurrentPoolId();
  const tokens = useDepositTokens();
  const token = tokens.find(tt => tt.tokenAddress === pool.tokenAddress);
  const decimals = token && token.decimals;

  const title = useMemo(
    () => (
      <div className="monitor-pool-card__title">
        <div className="term">
          {Number.parseInt(pool.poolId, 10) - currentPoolId === 0
            ? t('monitor_pool_card_title_today', { poolId: pool.poolId })
            : t('monitor_pool_card_title', {
                poolId: pool.poolId,
                term: Number.parseInt(pool.poolId, 10) - currentPoolId,
              })}
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
            {convertWeiToDecimal(pool.totalDeposit, 4, decimals)}
          </TextBox>
        </Col>
        <Col span={12}>
          <TextBox label={t('monitor_pool_card_label_available_amount')}>
            {convertWeiToDecimal(pool.availableAmount, 4, decimals)}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <TextBox label={t('monitor_pool_card_label_loan_interest')}>
            {Number.parseFloat(
              convertWeiToDecimal(pool.loanInterest, 4, decimals),
            )}
            {`%`}
          </TextBox>
        </Col>
        <Col span={12}>
          <TextBox label={t('monitor_pool_card_label_total_deposit_weight')}>
            {convertWeiToDecimal(pool.totalDepositWeight, 4, decimals)}
          </TextBox>
        </Col>
      </Row>
    </Card>
  );
};

export default withTranslation()(withRouter(MonitorPoolCard));
