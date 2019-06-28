import * as React from 'react';
import Form from '../components/html/Form';
import Button from '../components/html/Button';
import Input from '../components/html/Input';
import { Row, Cell } from '../components/common/Layout';
import styled from 'styled-components';
import { withTranslation, WithTranslation } from 'react-i18next';
import { observer, inject } from 'mobx-react';
import {
  TokenStore,
  IToken,
  LoanManagerStore,
  TransactionStore,
} from '../stores';
import { convertWeiToDecimal, convertDecimalToWei } from '../utils/BigNumber';
import {
  calculateRate,
  RatePeriod,
} from '../utils/interestRateCalculateHelper';
import dayjs from 'dayjs';

interface IProps extends WithTranslation {
  tokenStore: TokenStore;
  loanManagerStore: LoanManagerStore;
  transactionStore: TransactionStore;
  term?: number;
  loanTokenSymbol?: string;
  collateralTokenSymbol?: string;
}

interface IState {
  term: number;
  loanTokenSymbol: string;
  collateralTokenSymbol: string;
  loanAmount: number;
  collateralAmount: number;
}

// Modified from: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/26635#issuecomment-400260278
const updateState = <T extends string>(key: string, value: T) => (
  prevState: IState,
): IState => ({
  ...prevState,
  [key]: value,
});

@observer
@inject('tokenStore', 'loanManagerStore', 'transactionStore')
class LoanForm extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    const {
      term = 30,
      loanTokenSymbol = 'ETH',
      collateralTokenSymbol = 'DAI',
    } = this.props;

    this.state = {
      term,
      loanTokenSymbol,
      collateralTokenSymbol,
      loanAmount: 0,
      collateralAmount: 0,
    };
  }

  handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.currentTarget;

    this.setState(updateState(name, value));
  };

  handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { tokenStore, transactionStore } = this.props;
    const {
      term,
      loanTokenSymbol,
      collateralTokenSymbol,
      loanAmount,
      collateralAmount,
    } = this.state;
    const loanToken = tokenStore.getToken(loanTokenSymbol);
    const collateralToken = tokenStore.getToken(collateralTokenSymbol);

    // TODO: add input/checkbox field to use freed collateral
    const requestedFreedCollateral = 0;

    await transactionStore.loan(
      term,
      loanToken,
      collateralToken,
      convertDecimalToWei(loanAmount),
      convertDecimalToWei(collateralAmount),
      convertDecimalToWei(requestedFreedCollateral),
    );
  };

  renderOption(key: string, value: any, text?: string) {
    return (
      <option key={key} value={value}>
        {text ? text : value}
      </option>
    );
  }

  render() {
    const { tokenStore, loanManagerStore, t } = this.props;
    const {
      term,
      loanTokenSymbol,
      collateralTokenSymbol,
      loanAmount,
      collateralAmount,
    } = this.state;

    const tokenSymbolList = tokenStore.validTokens.map(
      (token: IToken) => token.symbol,
    );

    const loanTokenOptions = tokenSymbolList
      .filter(tokenSymbol => tokenSymbol !== collateralTokenSymbol)
      .map(tokenSymbol => this.renderOption(tokenSymbol, tokenSymbol));

    const collateralTokenOptions = tokenSymbolList
      .filter(tokenSymbol => tokenSymbol !== loanTokenSymbol)
      .map(tokenSymbol => this.renderOption(tokenSymbol, tokenSymbol));

    const termOptions = [1, 7, 30].map(thisTerm =>
      this.renderOption(thisTerm.toString(), thisTerm),
    );

    const loanToken = tokenStore.getToken(loanTokenSymbol);

    const dailyPercentageRate = loanToken.loanAnnualPercentageRates
      ? calculateRate(
          loanToken.loanAnnualPercentageRates[term],
          RatePeriod.Daily,
        )
      : 0;

    const loanAssetPair = loanManagerStore.getLoanAssetPair(
      loanTokenSymbol,
      collateralTokenSymbol,
    );

    // TODO: compute current collateral ratio given token amount and prices
    const currCollateralRatio = 'TODO';

    const minCollateralRatio = `${convertWeiToDecimal(
      loanAssetPair.collateralRatio,
    ) * 100}%`;

    const estimatedRepayAmount =
      loanAmount * Math.pow(1 + dailyPercentageRate / 100, term);

    const estimatedRepayDate = dayjs()
      .endOf('day')
      .add(term, 'day')
      .format('DD/MM/YYYY');

    return (
      <Form onSubmit={this.handleSubmit}>
        <Row>
          <Cell>
            <Form.Item>
              <label htmlFor="loanTokenSymbol">{t('borrow')}:</label>
              <select
                id="loanTokenSymbol"
                name="loanTokenSymbol"
                value={loanTokenSymbol}
                onChange={this.handleSelectChange}
              >
                {loanTokenOptions}
              </select>
            </Form.Item>
          </Cell>
          <Cell>
            <Form.Item>
              <label htmlFor="loanAmount">{t('amount')}:</label>
              <Input id="loanAmount" type="number" min="0" />
            </Form.Item>
          </Cell>
          <Cell>
            <Form.Item>
              <label htmlFor="term">{t('term')}:</label>
              <select
                id="term"
                name="term"
                value={term}
                onChange={this.handleSelectChange}
              >
                {termOptions}
              </select>
            </Form.Item>
          </Cell>
          <Cell>
            <Form.Item>
              <label htmlFor="dpr">{t('dpr')}:</label>{' '}
              <span id="dpr">TODO</span>
            </Form.Item>
          </Cell>
        </Row>

        <Row>
          <Cell>
            <Form.Item>
              <label htmlFor="collateralTokenSymbol">{t('collateral')}:</label>
              <select
                id="collateralTokenSymbol"
                name="collateralTokenSymbol"
                value={collateralTokenSymbol}
                onChange={this.handleSelectChange}
              >
                {collateralTokenOptions}
              </select>
            </Form.Item>
          </Cell>
          <Cell>
            <Form.Item>
              <label htmlFor="collateralAmount">{t('amount')}:</label>
              <Input id="collateralAmount" type="number" min="0" />
            </Form.Item>
          </Cell>
          <Cell>
            <Form.Item>
              <label htmlFor="collateralRatio">{t('collateral_ratio')}:</label>
              <span id="collateralRatio">TODO / {minCollateralRatio}</span>
            </Form.Item>
          </Cell>
        </Row>

        <Row>
          <Cell>
            <Form.Item>
              <span>
                You need to pay back TODO-amount {loanTokenSymbol} before
                TODO-date.
              </span>
            </Form.Item>
          </Cell>
        </Row>

        <Row>
          <Cell>
            <Form.Item>
              <Button primary>{t('loan')}</Button>
            </Form.Item>
          </Cell>
        </Row>
      </Form>
    );
  }
}

export default withTranslation()(LoanForm);
