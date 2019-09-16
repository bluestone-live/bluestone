import * as React from 'react';
import FreedCollateralList from '../containers/FreedCollateralList';
import Card from '../components/common/Card';
import { Row, Cell } from '../components/common/Layout';

export default () => {
  return (
    <Row>
      <Cell>{/* Statistics placeholder*/}</Cell>
      <Cell>
        <Card>
          <FreedCollateralList />
        </Card>
      </Cell>
    </Row>
  );
};
