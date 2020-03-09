import React, { useMemo } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useAllPools, useDepositTokens, PoolActions } from '../stores';
import { RouteComponentProps } from 'react-router';
import { parseQuery } from '../utils/parseQuery';
import { useDepsUpdated } from '../utils/useEffectAsync';
import { useDispatch } from 'react-redux';
import { getService } from '../services';
import { Row, Col } from 'antd/lib/grid';
import TextBox from '../components/TextBox';
import { convertWeiToDecimal } from '../utils/BigNumber';

interface IProps
  extends WithTranslation,
    RouteComponentProps<{ poolId: string }> {}

const MonitorDetailPage = (props: IProps) => {
  const {
    match: {
      params: { poolId },
    },
    location: { search },
    t,
  } = props;

  const dispatch = useDispatch();

  const allPools = useAllPools();
  const tokens = useDepositTokens();
  const queryParams = parseQuery(search);

  const selectedPool = useMemo(() => {
    if (allPools.length > 0 && poolId && queryParams.tokenAddress) {
      return allPools.find(
        pool =>
          pool.tokenAddress === queryParams.tokenAddress &&
          pool.poolId === poolId,
      );
    }
  }, [queryParams.tokenAddress, poolId]);
  const selectedToken = useMemo(() => {
    if (queryParams.tokenAddress) {
      return tokens.find(
        token => token.tokenAddress === queryParams.tokenAddress,
      );
    }
  }, [tokens, queryParams.tokenAddress]);

  useDepsUpdated(async () => {
    if (queryParams.tokenAddress) {
      const { poolService } = await getService();

      dispatch(
        PoolActions.replacePool(
          queryParams.tokenAddress,
          poolId,
          await poolService.getPoolByTokenAndId(
            queryParams.tokenAddress,
            poolId,
          ),
        ),
      );
    }
  }, [queryParams.tokenAddress]);

  if (!selectedPool || !selectedToken) {
    return null;
  }

  return (
    <div className="monitor-detail-page">
      <Row>
        <Col span={24}>
          <TextBox label={t('monitor_detail_page_label_token_symbol')}>
            {selectedToken.tokenSymbol}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <TextBox label={t('monitor_detail_page_label_pool_id')}>
            {selectedPool.poolId}
          </TextBox>
        </Col>
        <Col span={12}>
          <TextBox label={t('monitor_detail_page_label_current_term')}>
            {selectedPool.term}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <TextBox label={t('monitor_detail_page_label_total_deposit')}>
            {convertWeiToDecimal(selectedPool.totalDeposit)}
          </TextBox>
        </Col>
        <Col span={12}>
          <TextBox label={t('monitor_detail_page_label_total_deposit_weight')}>
            {convertWeiToDecimal(selectedPool.totalDepositWeight)}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <TextBox label={t('monitor_detail_page_label_loan_interest')}>
            {convertWeiToDecimal(selectedPool.loanInterest)}
          </TextBox>
        </Col>
        <Col span={12}>
          <TextBox label={t('monitor_detail_page_label_apr')}>
            {convertWeiToDecimal(selectedPool.APR)}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <TextBox label={t('monitor_detail_page_label_available_amount')}>
            {convertWeiToDecimal(selectedPool.availableAmount)}
          </TextBox>
        </Col>
        <Col span={12}>
          <TextBox label={t('monitor_detail_page_label_utilization')}>
            {convertWeiToDecimal(selectedPool.utilization)}
          </TextBox>
        </Col>
      </Row>
    </div>
  );
};

export default withTranslation()(MonitorDetailPage);
