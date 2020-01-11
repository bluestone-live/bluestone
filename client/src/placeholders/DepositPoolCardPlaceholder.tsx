import React from 'react';
import Card from 'antd/lib/card';
import { Row, Col } from 'antd/lib/grid';

const DepositPoolCardPlaceholder = () => {
  return (
    <Card className="deposit-pool-card" title="" bordered={false}>
      <Row>
        <Col span={8} />
        <Col span={8} />
        <Col span={8} />
      </Row>
    </Card>
  );
};

export default DepositPoolCardPlaceholder;
