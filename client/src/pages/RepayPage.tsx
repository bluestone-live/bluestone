import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { TransactionStore } from '../stores';
import Card from '../components/common/Card';
import Input from '../components/html/Input';
import { RouteComponentProps } from 'react-router-dom';
import Button from '../components/html/Button';
import Form from '../components/html/Form';
import { TransactionType, ILoanTransaction } from '../constants/Transaction';
import moment from 'moment';

interface IProps
  extends WithTranslation,
    RouteComponentProps<{ transactionId: string }> {
  transactionStore: TransactionStore;
}

interface IState {
  amount: number;
}

@inject('transactionStore')
@observer
class RepayPage extends React.Component<IProps, IState> {
  state = {
    amount: 0,
  };

  componentDidMount() {
    const { transactionStore, match } = this.props;
    transactionStore.getLoanTransactionById(match.params.transactionId);
  }

  onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({
      amount: Number.parseFloat(e.currentTarget.value),
    });

  onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { transactionStore, match } = this.props;
    const { amount } = this.state;

    transactionStore.repay(match.params.transactionId, amount);
  };

  render() {
    const { t, transactionStore, match } = this.props;
    const transaction = transactionStore.transactions.find(
      tx => tx.transactionId === match.params.transactionId,
    ) as ILoanTransaction;

    return transaction && transaction.type === TransactionType.Loan ? (
      <Card>
        <Form onSubmit={this.onSubmit}>
          <Form.Item>
            <label htmlFor="amount">{t('repay')}</label>
            <Input id="amount" type="number" onChange={this.onAmountChange} />
          </Form.Item>
          <Form.Item>
            <label>{t('remaining')}</label>
            <Input
              type="text"
              disabled
              value={`${transaction.loanAmount +
                transaction.accruedInterest -
                (transaction.alreadyPaidAmount || 0) -
                (transaction.liquidatedAmount || 0)} ${
                transaction.loanToken.symbol
              }`}
            />
          </Form.Item>
          <Form.Item>
            <label>{t('interest')}</label>
            <Input
              type="text"
              disabled
              value={`${transaction.accruedInterest || 0} ${
                transaction.loanToken.symbol
              }`}
            />
          </Form.Item>
          <Form.Item>
            <label>{t('expire_date')}</label>
            <Input
              type="text"
              disabled
              value={moment(transaction.createdAt)
                .add('day', transaction.term.value)
                .format('YYYY-MM-DD')}
            />
          </Form.Item>
          <Form.Item>
            <label />
            <Button primary>{t('submit')}</Button>
          </Form.Item>
        </Form>
      </Card>
    ) : (
      <Card>{t('transactionId_is_invalid')}</Card>
    );
  }
}

export default withTranslation()(RepayPage);
