import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  IDepositTransaction,
  TransactionStatus,
} from '../../constants/Transaction';
import { Row, Cell } from '../../components/common/Layout';
import Button from '../../components/html/Button';
import Anchor from '../../components/html/Anchor';
import { TransactionStore } from '../../stores';
import styled from 'styled-components';
import { ThemedProps } from '../../styles/themes';

interface IProps extends WithTranslation {
  depositTransaction: IDepositTransaction;
  transactionStore: TransactionStore;
}

const StyledItemCell = styled(Cell)`
  height: 50px;
  text-align: center;
  font-size: ${(props: ThemedProps) => props.theme.fontSize.medium};
  padding: ${(props: ThemedProps) => props.theme.gap.small};
`;

class DepositTransactionItem extends React.Component<IProps> {
  getActions = () => {
    const { depositTransaction, t } = this.props;
    if (depositTransaction.status === TransactionStatus.DepositMatured) {
      return (
        <Button fullWidth onClick={this.withdrawDeposit(depositTransaction)}>
          {t('withdraw')}
        </Button>
      );
    }
    if (depositTransaction.status === TransactionStatus.DepositRecurring) {
      return (
        <Button
          fullWidth
          onClick={this.toggleRenewal(depositTransaction, false)}
        >
          {t('disable_auto_renewal')}
        </Button>
      );
    }
    return (
      <Button onClick={this.toggleRenewal(depositTransaction, true)}>
        {t('enable_auto_renewal')}
      </Button>
    );
  };

  withdrawDeposit = (depositTransaction: IDepositTransaction) => async () => {
    return this.props.transactionStore.withdrawDeposit(
      depositTransaction.transactionAddress,
    );
  };

  toggleRenewal = (
    depositTransaction: IDepositTransaction,
    autoRenewal: boolean,
  ) => async () => {
    await this.props.transactionStore.toggleRenewal(
      depositTransaction.transactionAddress,
      autoRenewal,
    );
    return this.props.transactionStore.updateDeposit(
      depositTransaction.transactionAddress,
    );
  };

  render() {
    const { t, depositTransaction } = this.props;

    return (
      <div className="deposit-item">
        <Row>
          <StyledItemCell>
            <Anchor to="/action-logs">{depositTransaction.token.symbol}</Anchor>
          </StyledItemCell>
          <StyledItemCell>{t('deposit')!}</StyledItemCell>
          <StyledItemCell>{depositTransaction.depositAmount}</StyledItemCell>
          <StyledItemCell>
            {t(TransactionStatus[depositTransaction.status])}
          </StyledItemCell>
          <StyledItemCell>{this.getActions()}</StyledItemCell>
        </Row>
      </div>
    );
  }
}

export default withTranslation()(DepositTransactionItem);
