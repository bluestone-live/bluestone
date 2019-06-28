import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { TransactionStore } from '../stores';
import Card from '../components/common/Card';
import Input from '../components/html/Input';
import { RouteComponentProps } from 'react-router-dom';
import Button from '../components/html/Button';
import Form from '../components/html/Form';
import { IDepositTransaction, TransactionType } from '../constants/Transaction';

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
class WithdrawDepositPage extends React.Component<IProps, IState> {
  state = {
    amount: 0,
  };

  componentDidMount() {
    const { transactionStore, match } = this.props;
    transactionStore.getDepositTransactionById(match.params.transactionId);
  }

  onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({
      amount: Number.parseFloat(e.currentTarget.value),
    });

  onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { transactionStore, match } = this.props;
    const { amount } = this.state;

    transactionStore.withdrawDeposit(match.params.transactionId, amount);
  };

  render() {
    const { t, transactionStore, match } = this.props;
    const { amount } = this.state;
    const transaction = transactionStore.transactions.find(
      tx => tx.transactionId === match.params.transactionId,
    ) as IDepositTransaction;

    return transaction && transaction.type === TransactionType.Deposit ? (
      <Card>
        <Form onSubmit={this.onSubmit}>
          <Form.Item>
            <label htmlFor="amount">{t('deposit_amount')}</label>
            <Input id="amount" type="number" onChange={this.onAmountChange} />
          </Form.Item>
          <Form.Item>
            <label>{t('available_amount')}</label>
            <Input
              type="text"
              disabled
              value={`${transaction.depositAmount -
                (transaction.withdrewAmount || 0)} ${transaction.token.symbol}`}
            />
          </Form.Item>
          <Form.Item>
            <label>{t('you_will_get')}</label>
            <Input
              type="text"
              disabled
              value={`${amount || 0} ${transaction.token.symbol}`}
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

export default withTranslation()(WithdrawDepositPage);
