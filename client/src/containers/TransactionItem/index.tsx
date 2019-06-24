import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  ITransaction,
  IDepositTransaction,
  ILoanTransaction,
  TransactionType,
} from '../../constants/Transaction';
import { observer, inject } from 'mobx-react';
import DepositItem from './DepositItem';
import LoanItem from './LoanItem';

interface IProps extends WithTranslation {
  transaction: ITransaction;
}

@inject('transaction')
@observer
class TransactionItem extends React.Component<IProps> {
  render() {
    const { transaction } = this.props;
    if (transaction.type === TransactionType.Deposit) {
      return (
        <DepositItem depositTransaction={transaction as IDepositTransaction} />
      );
    }
    return <LoanItem loanTransaction={transaction as ILoanTransaction} />;
  }
}

export default withTranslation()(TransactionItem);
