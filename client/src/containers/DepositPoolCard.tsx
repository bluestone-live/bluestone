import React, { useMemo } from 'react';
import { IPool, useDepositTokens } from '../stores';
import Card from 'antd/lib/card';
import { Row, Col } from 'antd/lib/grid';
import TextBox from '../components/TextBox';
import { withTranslation, WithTranslation } from 'react-i18next';
import { convertWeiToDecimal } from '../utils/BigNumber';

interface IProps extends WithTranslation {
  pool: IPool;
  isMostBorrowed?: boolean;
  highlightColumn?: string;
  showUtilization?: boolean;
}

const DepositPoolCard = (props: IProps) => {
  const { pool, isMostBorrowed, highlightColumn, t, showUtilization } = props;

  const tokens = useDepositTokens();
  const token = tokens.find(ft => ft.tokenAddress === pool.tokenAddress);
  const decimals = token ? token.decimals : 18;

  const title = useMemo(
    () => (
      <div className="deposit-pool-card__title">
        <div
          className={`term ${highlightColumn === 'term' ? 'highlight' : ''}`}
        >
          {t('deposit_pool_card_term', { term: pool.term })}
        </div>
      </div>
    ),
    [pool.term, isMostBorrowed, highlightColumn],
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
              {convertWeiToDecimal(pool.totalDeposit, 4, decimals)}
            </span>
          </TextBox>
        </Col>
        <Col span={8} className={showUtilization ? '' : 'deposit-arrow'}>
          {showUtilization ? (
            <TextBox label={t('deposit_pool_card_text_utilization')}>
              <span
                className={
                  highlightColumn === 'utilization' ? 'highlight' : undefined
                }
              >
                {pool.utilization}%
              </span>
            </TextBox>
          ) : (
            <div>
              <span>{`${t('layout_default_deposit')}`}</span>
              <span className="icon">{'➤'}</span>
            </div>
          )}
        </Col>
      </Row>
    </Card>
  );
};

export default withTranslation()(DepositPoolCard);
