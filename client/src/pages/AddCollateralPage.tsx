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
import { toJS } from 'mobx';
import dayjs from 'dayjs';
import { convertDecimalToWei } from '../utils/BigNumber';

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
class AddCollateralPage extends React.Component<IProps, IState> {
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

  onSubmit = () => {
    const { transactionStore, match } = this.props;
    const { amount } = this.state;

    transactionStore.addCollateral(
      match.params.transactionId,
      convertDecimalToWei(amount),
    );
  };

  getCollateralizationRatio = (transaction: ILoanTransaction) => {
    if (!transaction.loanToken.price || !transaction.collateralToken.price) {
      return 'calculate error';
    }
    return (
      (transaction.collateralAmount *
        (transaction.collateralToken.price || 0)) /
      (transaction.loanToken.price || 1) /
      transaction.loanAmount
    );
  };

  render() {
    const { t, transactionStore, match } = this.props;
    const transaction = toJS(
      transactionStore.transactions.find(
        tx => tx.transactionId === match.params.transactionId,
      ),
    ) as ILoanTransaction;

    return transaction && transaction.type === TransactionType.Loan ? (
      <Card>
        <Form onSubmit={this.onSubmit}>
          <Form.Item>
            <label>{t('current_collateral')}</label>
            <Input
              type="text"
              disabled
              value={`${transaction.collateralAmount} ${transaction.collateralToken.symbol}`}
            />
          </Form.Item>
          <Form.Item>
            <label htmlFor="amount">{t('add_collateral_amount')}</label>
            <Input id="amount" type="number" onChange={this.onAmountChange} />
          </Form.Item>
          <Form.Item>
            <label>{t('collateralization_ratio')}</label>
            <Input
              type="text"
              disabled
              value={this.getCollateralizationRatio(transaction)}
            />
          </Form.Item>
          <Form.Item>
            <label>{t('expired_at')}</label>
            <Input
              type="text"
              disabled
              value={dayjs(transaction.createdAt)
                .add(transaction.term.value, 'day')
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

export default withTranslation()(AddCollateralPage);
