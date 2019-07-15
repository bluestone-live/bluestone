import * as React from 'react';
import Form from '../components/html/Form';
import Button from '../components/html/Button';
import Input from '../components/html/Input';
import { Row, Cell } from '../components/common/Layout';
import { withTranslation, WithTranslation } from 'react-i18next';
import { observer, inject } from 'mobx-react';
import { TokenStore, LoanManagerStore, TransactionStore } from '../stores';
import { convertWeiToDecimal, convertDecimalToWei } from '../utils/BigNumber';
import { updateState } from '../utils/updateState';
import { terms } from '../constants/Term';
import { IToken } from '../constants/Token';
import Select from '../components/html/Select';
import {
  calculateRate,
  RatePeriod,
} from '../utils/interestRateCalculateHelper';
import styled from 'styled-components';
import dayjs from 'dayjs';

interface IProps extends WithTranslation {
  tokenStore?: TokenStore;
  loanManagerStore?: LoanManagerStore;
  transactionStore?: TransactionStore;
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

const StyledTextBox = styled.span`
  display: block;
  width: 100%;
  flex: 1;
  font-size: 14px;
  padding: 0 7px;
  line-height: 35px;
  height: 35px;
`;

@inject('tokenStore', 'loanManagerStore', 'transactionStore')
@observer
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

    this.setState(updateState<string, IState>(name, value));
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
    const loanToken = tokenStore!.getToken(loanTokenSymbol);
    const collateralToken = tokenStore!.getToken(collateralTokenSymbol);

    if (!loanToken || !collateralToken) {
      // TODO: show error messages
      return;
    }

    // TODO: add input/checkbox field to use freed collateral
    const requestedFreedCollateral = 0;

    await transactionStore!.loan(
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

    const tokenSymbolList = tokenStore!.validTokens.map(
      (token: IToken) => token.symbol,
    );

    const loanTokenOptions = tokenSymbolList
      .filter(tokenSymbol => tokenSymbol !== collateralTokenSymbol)
      .map(tokenSymbol => this.renderOption(tokenSymbol, tokenSymbol));

    const collateralTokenOptions = tokenSymbolList
      .filter(tokenSymbol => tokenSymbol !== loanTokenSymbol)
      .map(tokenSymbol => this.renderOption(tokenSymbol, tokenSymbol));

    const termOptions = terms
      .map(iteratorTerm => iteratorTerm.value)
      .map(thisTerm => this.renderOption(thisTerm.toString(), thisTerm));

    const loanToken = tokenStore!.getToken(loanTokenSymbol);
    const collateralToken = tokenStore!.getToken(collateralTokenSymbol);

    const dailyPercentageRate = loanToken
      ? loanToken.loanAnnualPercentageRates
        ? calculateRate(
            loanToken!.loanAnnualPercentageRates[term],
            RatePeriod.Daily,
          )
        : 0
      : 0;

    const loanAssetPair = loanManagerStore!.getLoanAssetPair(
      loanTokenSymbol,
      collateralTokenSymbol,
    );

    const currCollateralRatio = (loanAmount === 0
      ? 0
      : (collateralAmount * collateralToken!.price!) /
        loanAmount /
        loanToken!.price!
    ).toFixed(2);

    const minCollateralRatio = `${convertWeiToDecimal(
      loanAssetPair!.collateralRatio,
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
              <Select
                id="loanTokenSymbol"
                name="loanTokenSymbol"
                value={loanTokenSymbol}
                onChange={this.handleChange}
              >
                {loanTokenOptions}
              </Select>
            </Form.Item>
          </Cell>
          <Cell>
            <Form.Item>
              <label htmlFor="loanAmount">{t('amount')}:</label>
              <Input
                id="loanAmount"
                name="loanAmount"
                type="number"
                onChange={this.handleChange}
                value={loanAmount}
                min="0"
              />
            </Form.Item>
          </Cell>
          <Cell>
            <Form.Item>
              <label htmlFor="term">{t('term')}:</label>
              <Select
                id="term"
                name="term"
                value={term}
                onChange={this.handleChange}
              >
                {termOptions}
              </Select>
            </Form.Item>
          </Cell>
          <Cell>
            <Form.Item>
              <label htmlFor="dpr">{t('dpr')}:</label>{' '}
              <StyledTextBox id="dpr">{dailyPercentageRate} %</StyledTextBox>
            </Form.Item>
          </Cell>
        </Row>

        <Row>
          <Cell>
            <Form.Item>
              <label htmlFor="collateralTokenSymbol">{t('collateral')}:</label>
              <Select
                id="collateralTokenSymbol"
                name="collateralTokenSymbol"
                value={collateralTokenSymbol}
                onChange={this.handleChange}
              >
                {collateralTokenOptions}
              </Select>
            </Form.Item>
          </Cell>
          <Cell>
            <Form.Item>
              <label htmlFor="collateralAmount">{t('amount')}:</label>
              <Input
                id="collateralAmount"
                type="number"
                name="collateralAmount"
                min="0"
                value={collateralAmount}
                onChange={this.handleChange}
              />
            </Form.Item>
          </Cell>
          <Cell>
            <Form.Item>
              <label htmlFor="collateralRatio">{t('collateral_ratio')}:</label>
              <StyledTextBox id="collateralRatio">
                {currCollateralRatio} % / {minCollateralRatio}
              </StyledTextBox>
            </Form.Item>
          </Cell>
        </Row>

        <Row>
          <Cell>
            <Form.Item>
              <StyledTextBox>
                You need to pay back {estimatedRepayAmount} {loanTokenSymbol}{' '}
                before
                {estimatedRepayDate}.
              </StyledTextBox>
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
