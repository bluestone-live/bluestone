import * as React from 'react';
import Card from '../components/common/Card';
import { withRouter, RouteComponentProps } from 'react-router';
import { inject, observer } from 'mobx-react';
import { updateState } from '../utils/updateState';
import { convertDecimalToWei, convertWeiToDecimal } from '../utils/BigNumber';
import { IToken } from '../constants/Token';
import { terms } from '../constants/Term';
import {
  calculateRate,
  RatePeriod,
} from '../utils/interestRateCalculateHelper';
import dayjs from 'dayjs';
import Form from '../components/html/Form';
import { Row, Cell } from '../components/common/Layout';
import Select from '../components/html/Select';
import Input from '../components/html/Input';
import StyledTextBox from '../components/common/TextBox';
import Button from '../components/html/Button';
import { withTranslation, WithTranslation } from 'react-i18next';
import { TokenStore, LoanManagerStore, RecordStore } from '../stores';

interface IProps extends WithTranslation, RouteComponentProps {
  tokenStore?: TokenStore;
  loanManagerStore?: LoanManagerStore;
  recordStore?: RecordStore;
  term: number;
  loanTokenSymbol: string;
  collateralTokenSymbol: string;
  onSelectChange: (
    key: string,
  ) => (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

interface IState {
  loanAmount: number;
  collateralAmount: number;
}

@inject('tokenStore', 'loanManagerStore', 'recordStore')
@observer
class LoanForm extends React.Component<IProps, IState> {
  state = { loanAmount: 0, collateralAmount: 0 };

  handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.currentTarget;
    this.setState(updateState<string, IState>(name, value));
  };

  handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const {
      tokenStore,
      recordStore,
      history,
      term,
      loanTokenSymbol,
      collateralTokenSymbol,
    } = this.props;
    const { loanAmount, collateralAmount } = this.state;
    const loanToken = tokenStore!.getToken(loanTokenSymbol || '');
    const collateralToken = tokenStore!.getToken(collateralTokenSymbol || '');

    if (!loanToken || !collateralToken || !term) {
      // TODO: show error messages
      return;
    }

    // TODO: add input/checkbox field to use freed collateral
    const requestedFreedCollateral = 0;

    await recordStore!.loan(
      term,
      loanToken,
      collateralToken,
      convertDecimalToWei(loanAmount),
      convertDecimalToWei(collateralAmount),
      convertDecimalToWei(requestedFreedCollateral),
    );

    history.push(`/records/loan?currentToken=${loanToken.address}`);
  };

  renderOption(key: string, value: any, text?: string) {
    return (
      <option key={key} value={value}>
        {text ? text : value}
      </option>
    );
  }

  estimateRepayAmount(annualPercentageRate: number) {
    const { loanAmount } = this.state;
    const { term } = this.props;
    const termPercentageRate = (annualPercentageRate / 365) * term;

    return loanAmount * (1 + termPercentageRate / 100);
  }

  render() {
    const {
      tokenStore,
      loanManagerStore,
      t,
      term,
      loanTokenSymbol,
      collateralTokenSymbol,
      onSelectChange,
    } = this.props;
    const { loanAmount, collateralAmount } = this.state;

    const tokenSymbolList = tokenStore!.validTokens.map(
      (token: IToken) => token.symbol,
    );

    const loanTokenOptions = tokenSymbolList.map(tokenSymbol =>
      this.renderOption(tokenSymbol, tokenSymbol),
    );

    const collateralTokenOptions = loanManagerStore!
      .getCollateralSymbolsByLoanSymbol(loanTokenSymbol)
      .map(tokenSymbol => this.renderOption(tokenSymbol, tokenSymbol));

    const termOptions = terms
      .map(iteratorTerm => iteratorTerm.value)
      .map(thisTerm => this.renderOption(thisTerm.toString(), thisTerm));

    const loanToken = tokenStore!.getToken(loanTokenSymbol);
    const collateralToken = tokenStore!.getToken(collateralTokenSymbol!);

    const annualPercentageRate = loanToken
      ? loanToken.loanAnnualPercentageRates
        ? calculateRate(
            loanToken!.loanAnnualPercentageRates[term],
            RatePeriod.Annual,
          ).toFixed(2)
        : '0'
      : '0';

    const loanAssetPair = loanManagerStore!.getLoanAssetPair(
      loanTokenSymbol,
      collateralTokenSymbol!,
    );

    let currCollateralRatio = '0';
    let minCollateralRatio = '0';

    if (loanAssetPair) {
      currCollateralRatio = (loanAmount === 0
        ? 0
        : ((collateralAmount * collateralToken!.price!) /
            loanAmount /
            loanToken!.price!) *
          100
      ).toFixed(2);

      minCollateralRatio = `${convertWeiToDecimal(
        loanAssetPair.collateralRatio,
      ) * 100}%`;
    }

    const estimatedRepayDate = dayjs()
      .endOf('day')
      .add(term, 'day')
      .format('DD/MM/YYYY');

    return (
      <div>
        <Card>
          <Form onSubmit={this.handleSubmit}>
            <Row>
              <Cell>
                <Form.Item>
                  <label htmlFor="loanTokenSymbol">{t('borrow')}:</label>
                  <Select
                    id="loanTokenSymbol"
                    name="loanTokenSymbol"
                    value={loanTokenSymbol}
                    onChange={onSelectChange('loanTokenSymbol')}
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
                    step="any"
                    min="0"
                    onChange={this.handleChange}
                    value={loanAmount}
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
                    onChange={onSelectChange('term')}
                  >
                    {termOptions}
                  </Select>
                </Form.Item>
              </Cell>
              <Cell>
                <Form.Item>
                  <label htmlFor="apr">{t('apr')}:</label>{' '}
                  <StyledTextBox id="apr">
                    {annualPercentageRate}%
                  </StyledTextBox>
                </Form.Item>
              </Cell>
            </Row>

            <Row>
              <Cell>
                <Form.Item>
                  <label htmlFor="collateralTokenSymbol">
                    {t('collateral')}:
                  </label>
                  <Select
                    id="collateralTokenSymbol"
                    name="collateralTokenSymbol"
                    value={collateralTokenSymbol}
                    onChange={onSelectChange('collateralTokenSymbol')}
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
                    step="any"
                    min="0"
                    value={collateralAmount}
                    onChange={this.handleChange}
                  />
                </Form.Item>
              </Cell>
              <Cell>
                <Form.Item>
                  <label htmlFor="collateralRatio">
                    {t('collateral_ratio')}:
                  </label>
                  <StyledTextBox id="collateralRatio">
                    {currCollateralRatio} % / {minCollateralRatio}
                  </StyledTextBox>
                </Form.Item>
              </Cell>
            </Row>

            {this.state.loanAmount > 0 ? (
              <Row>
                <Cell>
                  <Form.Item>
                    <StyledTextBox>
                      You need to pay back{' '}
                      {this.estimateRepayAmount(
                        Number.parseInt(annualPercentageRate, 10),
                      )}{' '}
                      {loanTokenSymbol} in estimation before
                      {estimatedRepayDate}.
                    </StyledTextBox>
                  </Form.Item>
                </Cell>
              </Row>
            ) : (
              ''
            )}
            <Row>
              <Cell>
                <Form.Item>
                  <Button primary>{t('loan')}</Button>
                </Form.Item>
              </Cell>
            </Row>
          </Form>
        </Card>
      </div>
    );
  }
}

export default withTranslation()(withRouter(LoanForm));
