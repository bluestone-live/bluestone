import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { WithTranslation, withTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import Input from '../components/html/Input';
import { RouteComponentProps } from 'react-router-dom';
import Button from '../components/html/Button';
import Form from '../components/html/Form';
import { AccountStore, ConfigurationStore } from '../stores';
import { convertDecimalToWei } from '../utils/BigNumber';

interface IProps
  extends WithTranslation,
    RouteComponentProps<{ tokenAddress: string }> {
  accountStore: AccountStore;
  configurationStore: ConfigurationStore;
}

interface IState {
  amount: number;
  loading: boolean;
}

@inject('accountStore', 'configurationStore')
@observer
class WithdrawFreedCollateralPage extends React.Component<IProps, IState> {
  state = {
    amount: 0,
    loading: false,
  };

  onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({
      amount: Number.parseFloat(e.currentTarget.value),
    });

  onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    this.setState({
      loading: true,
    });

    const { accountStore, match } = this.props;
    const { amount } = this.state;

    accountStore.withdrawFreedCollateral(
      match.params.tokenAddress,
      convertDecimalToWei(amount),
    );

    this.setState({
      loading: false,
    });
  };

  render() {
    const { t, match, accountStore, configurationStore } = this.props;
    const { amount, loading } = this.state;
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
            <Button
              primary
              loading={loading}
              disabled={configurationStore.isUserActionsLocked}
            >
              {t('submit')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    );
  }
}

export default withTranslation()(WithdrawFreedCollateralPage);
