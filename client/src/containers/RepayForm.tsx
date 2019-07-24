import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { TransactionStore } from '../stores';
import Card from '../components/common/Card';
import Input from '../components/html/Input';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import Button from '../components/html/Button';
import Form from '../components/html/Form';
import { TransactionType, ILoanTransaction } from '../constants/Transaction';
import dayjs from 'dayjs';
import { convertDecimalToWei } from '../utils/BigNumber';

interface IProps
  extends WithTranslation,
    RouteComponentProps<{ transactionAddress: string }> {
  transactionStore?: TransactionStore;
}

interface IState {
  amount: number;
  loading: boolean;
}

@inject('transactionStore')
@observer
class RepayForm extends React.Component<IProps, IState> {
  state = {
    amount: 0,
    loading: false,
  };

  async componentDidMount() {
    const { transactionStore, match } = this.props;
    await transactionStore!.updateLoanTransaction(
      match.params.transactionAddress,
    );
    this.setState({
      loading: true,
    });
  }

  onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({
      amount: Number.parseFloat(e.currentTarget.value),
    });

  onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { transactionStore, match, history } = this.props;
    const { amount } = this.state;

    await transactionStore!.repay(
      match.params.transactionAddress,
      convertDecimalToWei(amount),
    );
    const transaction = transactionStore!.getTransactionByAddress(
      match.params.transactionAddress,
    ) as ILoanTransaction;

    history.push(
      `/transactions?tokenSymbol=${transaction.loanToken.symbol}&term=&status=`,
    );
  };

  repayFully = async () => {
    const { transactionStore, match, history } = this.props;

    await transactionStore!.repayFully(match.params.transactionAddress);
    const transaction = transactionStore!.getTransactionByAddress(
      match.params.transactionAddress,
    ) as ILoanTransaction;

    history.push(
      `/transactions?tokenSymbol=${transaction.loanToken.symbol}&term=&status=`,
    );
  };

  render() {
    const { t, transactionStore, match } = this.props;
    const transaction = transactionStore!.getTransactionByAddress(
      match.params.transactionAddress,
    ) as ILoanTransaction;

    return transaction && transaction.type === TransactionType.Loan ? (
      <Card>
        <Form onSubmit={this.onSubmit}>
          <Form.Item>
            <label htmlFor="amount">{t('repay')}</label>
            <Input
              id="amount"
              type="number"
              step={1e-18}
              min={1e-18}
              max={transaction.remainingDebt}
              onChange={this.onAmountChange}
            />
          </Form.Item>
          <Form.Item>
            <label>{t('remaining')}</label>
            <Input
              type="text"
              disabled
              value={`${transaction.remainingDebt}`}
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
              value={dayjs(transaction.createdAt)
                .add(transaction.term.value, 'day')
                .format('YYYY-MM-DD')}
            />
          </Form.Item>
          <Form.Item>
            <Button.Group>
              <Button type="button" primary onClick={this.repayFully}>
                {t('fully_repay')}
              </Button>
              <Button>{t('submit')}</Button>
            </Button.Group>
          </Form.Item>
        </Form>
      </Card>
    ) : (
      <Card>{t('transactionId_is_invalid')}</Card>
    );
  }
}

export default withTranslation()(withRouter(RepayForm));
