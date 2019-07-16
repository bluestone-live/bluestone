import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { TransactionStore, TokenStore } from '../stores';
import Card from '../components/common/Card';
import Input from '../components/html/Input';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import Radio, { IRadioOption } from '../components/common/Radio';
import { terms, ITerm } from '../constants/Term';
import Button from '../components/html/Button';
import { convertDecimalToWei } from '../utils/BigNumber';
import Form from '../components/html/Form';
import { Row, Cell } from '../components/common/Layout';
import StyledTextBox from '../components/common/TextBox';
import {
  calculateRate,
  RatePeriod,
} from '../utils/interestRateCalculateHelper';

interface IProps
  extends WithTranslation,
    RouteComponentProps<{ tokenSymbol: string }> {
  transactionStore: TransactionStore;
  tokenStore: TokenStore;
}

interface IState {
  selectedTerm: ITerm;
  selectedAutoRenewal: IRadioOption<boolean>;
  amount: number;
}

const isAutoRenewal = [
  {
    text: 'yes',
    value: true,
  },
  {
    text: 'no',
    value: false,
  },
];

@inject('transactionStore', 'tokenStore')
@observer
class DepositForm extends React.Component<IProps, IState> {
  state = {
    selectedTerm: terms[0],
    selectedAutoRenewal: isAutoRenewal[0],
    amount: 0,
  };

  terms = terms.map(term => ({
    ...term,
    text: this.props.t(term.text),
  }));

  isAutoRenewal = isAutoRenewal.map(option => ({
    ...option,
    text: this.props.t(option.text),
  }));

  componentDidMount() {
    const { match, history } = this.props;

    if (!match.params.tokenSymbol) {
      history.replace(`/deposit/ETH`);
    }
  }

  onTermSelect = (value: number) => {
    const term = this.terms.find(t => t.value === value);
    if (!term) {
      return;
    }
    this.setState({
      selectedTerm: term,
    });
  };

  onAutoRenewChange = (value: boolean) => {
    const option = this.isAutoRenewal.find(o => o.value === value);
    if (!option) {
      return;
    }
    this.setState({
      selectedAutoRenewal: option,
    });
  };

  onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({
      amount: Number.parseFloat(e.currentTarget.value),
    });

  onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { transactionStore, tokenStore, match, history } = this.props;
    const currentToken = tokenStore.getToken(match.params.tokenSymbol);
    const { selectedAutoRenewal, selectedTerm, amount } = this.state;

    await transactionStore.deposit(
      currentToken!,
      selectedTerm.value,
      convertDecimalToWei(amount),
      selectedAutoRenewal.value,
    );

    history.push(`/transactions?tokenSymbol=${match.params.tokenSymbol}`);
  };

  render() {
    const { tokenStore, match, t } = this.props;
    const currentToken = tokenStore.getToken(match.params.tokenSymbol);
    const { selectedTerm, selectedAutoRenewal } = this.state;

    return (
      <Card>
        <Form onSubmit={this.onSubmit}>
          <h3>{currentToken ? currentToken.symbol : null}</h3>
          <Form.Item>
            <Row>
              <Cell>
                <label htmlFor="amount">{t('deposit_amount')}</label>
              </Cell>
              <Cell scale={4}>
                <Input
                  fullWidth
                  id="amount"
                  type="number"
                  step="any"
                  min="0"
                  onChange={this.onAmountChange}
                />
              </Cell>
            </Row>
          </Form.Item>
          <Form.Item>
            <Cell>
              <label>{t('select_term')}</label>
            </Cell>
            <Cell scale={4}>
              <Radio<number>
                name="term"
                options={this.terms}
                onChange={this.onTermSelect}
                selectedOption={selectedTerm}
              />
            </Cell>
          </Form.Item>
          <Form.Item>
            <Cell>
              <label>{t('deposit_apr')}</label>
            </Cell>
            <Cell scale={4}>
              <StyledTextBox>
                {calculateRate(
                  currentToken!.depositAnnualPercentageRates![
                    selectedTerm.value
                  ],
                  RatePeriod.Annual,
                )}
              </StyledTextBox>
            </Cell>
          </Form.Item>
          <Form.Item>
            <Cell>
              <label>{t('is_auto_renewal')}</label>
            </Cell>
            <Cell scale={4}>
              <Radio<boolean>
                name="is-auto-renewal"
                options={this.isAutoRenewal}
                onChange={this.onAutoRenewChange}
                selectedOption={selectedAutoRenewal}
              />
            </Cell>
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

export default withTranslation()(withRouter(DepositForm));
