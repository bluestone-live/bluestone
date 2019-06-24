import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  ILoanTransaction,
  LoanTransactionStatus,
} from '../../constants/Transaction';
import { Row, Cell } from '../../components/common/Layout';
import Button from '../../components/html/Button';

interface IProps extends WithTranslation {
  loanTransaction: ILoanTransaction;
}

class LoanTransactionItem extends React.Component<IProps> {
  getActions = () => {
    const { loanTransaction, t } = this.props;
    if (loanTransaction.status === LoanTransactionStatus.Liquidated) {
      return (
        <div className="btn-group">
          <Button>{t('withdraw_collateral')}</Button>
          <Button>{t('withdraw_liquidated')}</Button>
        </div>
      );
    }
    if (loanTransaction.status === LoanTransactionStatus.Closed) {
      return (
        <div className="btn-group">
          <Button>{t('withdraw_collateral')}</Button>
        </div>
      );
    }
    return (
      <div className="btn-group">
        <Button>{t('add_collateral')}</Button>
        <Button>{t('repay')}</Button>
      </div>
    );
  };

  render() {
    const { t, loanTransaction } = this.props;

    return (
      <div className="deposit-item">
        <Row>
          <Cell>
            collateral: {loanTransaction.collateralToken.symbol}; loan:
            {loanTransaction.loanToken.symbol}
          </Cell>
          <Cell>{t('loan')!}</Cell>
          <Cell>{loanTransaction.loanAmount}</Cell>
          <Cell>{loanTransaction.status}</Cell>
          <Cell>{this.getActions()}</Cell>
        </Row>
      </div>
    );
  }
}

export default withTranslation()(LoanTransactionItem);
