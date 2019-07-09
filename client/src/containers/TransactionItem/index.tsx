import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  ITransaction,
  IDepositTransaction,
  ILoanTransaction,
  TransactionType,
} from '../../constants/Transaction';
import { observer } from 'mobx-react';
import DepositItem from './DepositItem';
import LoanItem from './LoanItem';
import { TransactionStore } from '../../stores';

interface IProps extends WithTranslation {
  transaction: ITransaction;
  transactionStore: TransactionStore;
}

@observer
class TransactionItem extends React.Component<IProps> {
  render() {
    const { transaction, transactionStore } = this.props;
    if (transaction.type === TransactionType.Deposit) {
      return (
        <DepositItem
          transactionStore={transactionStore}
          depositTransaction={transaction as IDepositTransaction}
        />
      );
    }
    return <LoanItem loanTransaction={transaction as ILoanTransaction} />;
  }
}

export default withTranslation()(TransactionItem);
