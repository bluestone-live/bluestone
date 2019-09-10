import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  RecordStore,
  TokenStore,
  ConfigurationStore,
  DepositManagerStore,
} from '../stores';
import Card from '../components/common/Card';
import Input from '../components/html/Input';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import Radio from '../components/common/Radio';
import { ITerm } from '../constants/Term';
import Button from '../components/html/Button';
import { convertDecimalToWei, BigNumber } from '../utils/BigNumber';
import Form from '../components/html/Form';
import { Cell } from '../components/common/Layout';
import { stringify } from 'querystring';

interface IProps
  extends WithTranslation,
    RouteComponentProps<{ tokenSymbol: string }> {
  recordStore?: RecordStore;
  tokenStore?: TokenStore;
  configurationStore?: ConfigurationStore;
  depositManagerStore?: DepositManagerStore;
}

interface IState {
  selectedTerm: ITerm;
  amount: number;
  loading: boolean;
}

@inject(
  'recordStore',
  'tokenStore',
  'configurationStore',
  'depositManagerStore',
)
@observer
class DepositForm extends React.Component<IProps, IState> {
  state = {
    selectedTerm: this.props.depositManagerStore!.depositTerms[0],
    amount: 0,
    loading: false,
  };

  componentDidMount() {
    const { match, history } = this.props;

    if (!match.params.tokenSymbol) {
      history.replace(`/deposit/ETH`);
    }
  }

  onTermSelect = (value: number) => {
    this.setState({
      selectedTerm: {
        text: `${value}-Day`,
        value,
      },
    });
  };

  onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({
      amount: Number.parseFloat(e.currentTarget.value),
    });

  onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { recordStore, tokenStore, match, history } = this.props;
    const currentToken = tokenStore!.getToken(match.params.tokenSymbol);
    const { selectedTerm, amount } = this.state;

    this.setState({
      loading: true,
    });

    try {
      const record = await recordStore!.deposit(
        currentToken!,
        new BigNumber(selectedTerm.value),
        convertDecimalToWei(amount),
      );

      this.setState({
        loading: false,
      });

      history.push({
        pathname: '/records/deposit',
        search: stringify({
          currentToken: currentToken!.address,
          recordAddress: record!.recordAddress,
        }),
      });
    } catch (e) {
      this.setState({
        loading: false,
      });
    }
  };

  render() {
    const {
      tokenStore,
      configurationStore,
      depositManagerStore,
      match,
      t,
    } = this.props;
    const currentToken = tokenStore!.getToken(match.params.tokenSymbol);
    const { selectedTerm, loading } = this.state;

    return (
      <Card>
        <Form onSubmit={this.onSubmit}>
          <Form.Item>
            <Cell>
              <label htmlFor="amount">{t('deposit_amount')}</label>
            </Cell>
            <Cell scale={4}>
              <Input
                fullWidth
                id="amount"
                type="number"
                step={1e-18}
                min={1e-18}
                onChange={this.onAmountChange}
                suffix={currentToken!.symbol}
              />
            </Cell>
          </Form.Item>
          <Form.Item>
            <Cell>
              <label>{t('select_term')}</label>
            </Cell>
            <Cell scale={4}>
              <Radio<number>
                name="term"
                options={depositManagerStore!.depositTerms}
                onChange={this.onTermSelect}
                selectedOption={selectedTerm}
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
                disabled={configurationStore!.isUserActionsLocked}
                loading={loading}
              >
                {t('submit')}
              </Button>
            </Cell>
          </Form.Item>
        </Form>
      </Card>
    );
  }
}

export default withTranslation()(withRouter(DepositForm));
