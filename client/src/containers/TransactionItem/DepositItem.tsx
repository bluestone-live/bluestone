import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  IDepositTransaction,
  TransactionStatus,
} from '../../constants/Transaction';
import { Row, Cell } from '../../components/common/Layout';
import Button from '../../components/html/Button';
import Anchor from '../../components/html/Anchor';

interface IProps extends WithTranslation {
  depositTransaction: IDepositTransaction;
}

class DepositTransactionItem extends React.Component<IProps> {
  getActions = () => {
    const { depositTransaction, t } = this.props;
    if (depositTransaction.status === TransactionStatus.DepositMatured) {
      return <Button>{t('withdraw')}</Button>;
    }
    if (depositTransaction.status === TransactionStatus.DepositAutoRenewal) {
      return <Button>{t('disable_auto_renewal')}</Button>;
    }
    return <Button>{t('enable_auto_renewal')}</Button>;
  };

  render() {
    const { t, depositTransaction } = this.props;

    return (
      <div className="deposit-item">
        <Row>
          <Cell>
            <Anchor to="/action-logs">{depositTransaction.token.symbol}</Anchor>
          </Cell>
          <Cell>{t('deposit')!}</Cell>
          <Cell>{depositTransaction.depositAmount}</Cell>
          <Cell>{depositTransaction.status}</Cell>
          <Cell>{this.getActions()}</Cell>
        </Row>
      </div>
    );
  }
}

export default withTranslation()(DepositTransactionItem);
