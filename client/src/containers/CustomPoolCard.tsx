import React, { useCallback } from 'react';
import { IPool, IToken } from '../stores';
import Card from 'antd/lib/card';
import { Row, Col } from 'antd/lib/grid';
import { withTranslation, WithTranslation } from 'react-i18next';
import FormInput from '../components/FormInput';
import { RouteComponentProps, withRouter } from 'react-router';
import Button from 'antd/lib/button';
import TextBox from '../components/TextBox';
import { convertWeiToDecimal } from '../utils/BigNumber';

interface IProps extends WithTranslation, RouteComponentProps {
  pool?: IPool;
  selectedTerm: number;
  minTerm: number;
  maxTerm: number;
  selectedToken?: IToken;
  onSelectedTermChange: (term: string) => void;
}

const CustomDepositPoolCard = (props: IProps) => {
  const {
    pool,
    selectedTerm,
    selectedToken,
    onSelectedTermChange,
    minTerm,
    maxTerm,
    history,
    t,
  } = props;

  const goTo = useCallback(() => {
    if (pool) {
      history.push(
        `/deposit/${pool.poolId}?tokenAddress=${selectedToken &&
          selectedToken.tokenAddress}`,
      );
    }
  }, [selectedToken, pool]);

  return (
    <Card className="deposit-pool-card" title="Input Term" bordered={false}>
      <Row style={{ margin: 0 }}>
        <FormInput
          label=""
          type="number"
          value={selectedTerm}
          onChange={onSelectedTermChange}
          min={minTerm}
          max={maxTerm}
          actionButtons={[
            <Button
              key="go"
              style={{ border: 0 }}
              type="primary"
              onClick={goTo}
            >
              Go
            </Button>,
          ]}
        />
      </Row>
      {pool && (
        <Row>
          <Col span={8}>
            <TextBox label={t('deposit_pool_card_text_apr')}>
              {pool.APR}%
            </TextBox>
          </Col>
          <Col span={8}>
            <TextBox label={t('deposit_pool_card_text_total_deposit')}>
              {convertWeiToDecimal(pool.totalDeposit)}
            </TextBox>
          </Col>
          <Col span={8}>
            <TextBox label={t('deposit_pool_card_text_utilization')}>
              {pool.utilization}%
            </TextBox>
          </Col>
        </Row>
      )}
    </Card>
  );
};

export default withTranslation()(withRouter(CustomDepositPoolCard));
