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
import { Cell } from '../components/common/Layout';

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

  onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { accountStore, match } = this.props;
    const { amount } = this.state;

    try {
      this.setState({
        loading: true,
      });

      await accountStore.withdrawFreedCollateral(
        match.params.tokenAddress,
        convertDecimalToWei(amount),
      );
      this.setState({
        loading: false,
      });
    } catch (e) {
      this.setState({
        loading: false,
      });
    }
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
            <Cell>
              <label htmlFor="amount">{t('collateral_amount')}</label>
            </Cell>
            <Cell scale={4}>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={this.onAmountChange}
              />
            </Cell>
          </Form.Item>
          <Form.Item>
            <Cell>
              <label>{t('available_amount')}</label>
            </Cell>
            <Cell scale={4}>
              <Input
                type="text"
                disabled
                value={availableAmount ? availableAmount.toString() : 0}
              />
            </Cell>
          </Form.Item>
          <Form.Item>
            <Cell>
              <label />
            </Cell>
            <Cell scale={4}>
              <Button
                primary
                fullWidth
                loading={loading}
                disabled={configurationStore.isUserActionsLocked}
              >
                {t('withdraw')}
              </Button>
            </Cell>
          </Form.Item>
        </Form>
      </Card>
    );
  }
}

export default withTranslation()(WithdrawFreedCollateralPage);
