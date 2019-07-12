import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  ILoanTransaction,
  TransactionStatus,
} from '../../constants/Transaction';
import { Row, Cell } from '../../components/common/Layout';
import Button from '../../components/html/Button';
import Anchor from '../../components/html/Anchor';
import { RouteComponentProps, withRouter } from 'react-router';

interface IProps extends WithTranslation, RouteComponentProps {
  loanTransaction: ILoanTransaction;
}

class LoanTransactionItem extends React.Component<IProps> {
  goTo = (path: string) => () => this.props.history.push(path);

  getActions = () => {
    const { loanTransaction, t } = this.props;
    if (loanTransaction.status === TransactionStatus.LoanLiquidating) {
      return <div className="btn-group">{t('transaction_liquidating')}</div>;
    }
    if (loanTransaction.status === TransactionStatus.LoanClosed) {
      return (
        <div className="btn-group">
          <Button
            onClick={this.goTo(
              `loan/collateral/withdraw/${loanTransaction.transactionAddress}`,
            )}
          >
            {t('withdraw_collateral')}
          </Button>
        </div>
      );
    }
    return (
      <div className="btn-group">
        <Button
          onClick={this.goTo(
            `/loan/collateral/add/${loanTransaction.transactionAddress}`,
          )}
        >
          {t('add_collateral')}
        </Button>
        <Button
          onClick={this.goTo(
            `/loan/repay/${loanTransaction.transactionAddress}`,
          )}
        >
          {t('repay')}
        </Button>
      </div>
    );
  };

  render() {
    const { t, loanTransaction } = this.props;

    return (
      <div className="deposit-item">
        <Row>
          <Cell>
            <Anchor to="/action-logs">
              collateral: {loanTransaction.collateralToken.symbol}; loan:
              {loanTransaction.loanToken.symbol}
            </Anchor>
          </Cell>
          <Cell>{t('loan')}</Cell>
          <Cell>{loanTransaction.loanAmount}</Cell>
          <Cell>{t(TransactionStatus[loanTransaction.status])}</Cell>
          <Cell>{this.getActions()}</Cell>
        </Row>
      </div>
    );
  }
}

export default withTranslation()(withRouter(LoanTransactionItem));
