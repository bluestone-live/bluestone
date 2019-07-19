import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { WithTranslation, withTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import Input from '../components/html/Input';
import { RouteComponentProps } from 'react-router-dom';
import Button from '../components/html/Button';
import Form from '../components/html/Form';
import { AccountStore } from '../stores';
import { convertDecimalToWei } from '../utils/BigNumber';

interface IProps
  extends WithTranslation,
    RouteComponentProps<{ tokenAddress: string }> {
  accountStore: AccountStore;
}

interface IState {
  amount: number;
}

@inject('accountStore')
@observer
class WithdrawFreedCollateralPage extends React.Component<IProps, IState> {
  state = {
    amount: 0,
  };

  onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({
      amount: Number.parseFloat(e.currentTarget.value),
    });

  onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { accountStore, match } = this.props;
    const { amount } = this.state;

    accountStore.withdrawFreedCollateral(
      match.params.tokenAddress,
      convertDecimalToWei(amount),
    );
  };

  render() {
    const { t, match, accountStore } = this.props;
    const { amount } = this.state;
    const availableAmount = accountStore.getFreedCollateralByAddress(
      match.params.tokenAddress,
    );

    return (
      <Card>
        <Form onSubmit={this.onSubmit}>
          <Form.Item>
            <label htmlFor="amount">{t('collateral_amount')}</label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={this.onAmountChange}
            />
          </Form.Item>
          <Form.Item>
            <label>{t('available_amount')}</label>
            <Input
              type="text"
              disabled
              value={availableAmount ? availableAmount.toString() : 0}
            />
          </Form.Item>
          <Form.Item>
            <label />
            <Button primary>{t('submit')}</Button>
          </Form.Item>
        </Form>
      </Card>
    );
  }
}

export default withTranslation()(WithdrawFreedCollateralPage);
