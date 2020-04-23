import React, { useMemo, useState } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { useAllPools, useDepositTokens, PoolActions, IPool } from '../stores';
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

  const tokens = useDepositTokens();
  const queryParams = parseQuery(search);

  const [selectedPool, setSelectedPool] = useState<IPool>();

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

      setSelectedPool(
        await poolService.getPoolByTokenAndId(queryParams.tokenAddress, poolId),
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
            {convertWeiToDecimal(
              selectedPool.totalDeposit,
              4,
              selectedToken.decimals,
            )}
          </TextBox>
        </Col>
        <Col span={12}>
          <TextBox label={t('monitor_detail_page_label_total_deposit_weight')}>
            {convertWeiToDecimal(
              selectedPool.totalDepositWeight,
              4,
              selectedToken.decimals,
            )}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <TextBox label={t('monitor_detail_page_label_loan_interest')}>
            {convertWeiToDecimal(
              selectedPool.loanInterest,
              2,
              selectedToken.decimals,
            )}
          </TextBox>
        </Col>
        <Col span={12}>
          <TextBox label={t('monitor_detail_page_label_apr')}>
            {selectedPool.APR}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <TextBox label={t('monitor_detail_page_label_available_amount')}>
            {convertWeiToDecimal(
              selectedPool.availableAmount,
              4,
              selectedToken.decimals,
            )}
          </TextBox>
        </Col>
        <Col span={12}>
          <TextBox label={t('monitor_detail_page_label_utilization')}>
            {selectedPool.utilization}
          </TextBox>
        </Col>
      </Row>
    </div>
  );
};

export default withTranslation()(MonitorDetailPage);
