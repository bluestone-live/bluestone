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
import { toJS } from 'mobx';
import { convertDecimalToWei } from '../utils/BigNumber';

interface IProps
  extends WithTranslation,
    RouteComponentProps<{ transactionAddress: string }> {
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
    transactionStore.updateLoanTransaction(match.params.transactionAddress);
  }

  onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({
      amount: Number.parseFloat(e.currentTarget.value),
    });

  onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { transactionStore, match, history } = this.props;
    const { amount } = this.state;

    await transactionStore.addCollateral(
      match.params.transactionAddress,
      convertDecimalToWei(amount),
      convertDecimalToWei(0), // TODO request free collateral will add later
    );
    await transactionStore.updateLoanTransaction(
      match.params.transactionAddress,
    );
    const transaction = transactionStore.getTransactionByAddress(
      match.params.transactionAddress,
    ) as ILoanTransaction;

    history.push(`/transactions?tokenSymbol=${transaction.loanToken.symbol}`);
  };

  getCollateralRatio = (transaction: ILoanTransaction) => {
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
        tx => tx.transactionAddress === match.params.transactionAddress,
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
            <Input
              id="amount"
              type="number"
              step={1e-8}
              onChange={this.onAmountChange}
            />
          </Form.Item>
          <Form.Item>
            <label>{t('collateral_ratio')}</label>
            <Input
              type="text"
              disabled
              value={this.getCollateralRatio(transaction)}
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

export default withTranslation()(withRouter(AddCollateralPage));
