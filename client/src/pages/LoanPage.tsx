import * as React from 'react';
import Card from '../components/common/Card';
import { withRouter, RouteComponentProps } from 'react-router';
import { inject, observer } from 'mobx-react';
import { stringify } from 'querystring';
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
import { TokenStore, LoanManagerStore, TransactionStore } from '../stores';
import parseQuery from '../utils/parseQuery';

interface IProps extends WithTranslation, RouteComponentProps {
  tokenStore?: TokenStore;
  loanManagerStore?: LoanManagerStore;
  transactionStore?: TransactionStore;
}

interface IState {
  loanAmount: number;
  collateralAmount: number;
}

@inject('tokenStore', 'loanManagerStore', 'transactionStore')
@observer
class LoanPage extends React.Component<IProps, IState> {
  state = { loanAmount: 0, collateralAmount: 0 };

  updateQueryParams = (params: { [key: string]: string }) => {
    const {
      location: { search },
      history,
    } = this.props;

    history.replace({
      pathname: window.location.pathname,
      search: stringify({
        ...parseQuery(search),
        ...params,
      }),
    });
  };

  handleSelectChange = (key: string) => ({
    currentTarget: { value },
  }: React.ChangeEvent<HTMLSelectElement>) => {
    this.updateQueryParams({ [key]: value });
  };

  handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.currentTarget;
    this.setState(updateState<string, IState>(name, value));
  };

  handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const {
      tokenStore,
      transactionStore,
      loanManagerStore,
      history,
      location: { search },
      t,
    } = this.props;
    const { term, loanTokenSymbol, collateralTokenSymbol } = parseQuery(search);
    const { loanAmount, collateralAmount } = this.state;
    const loanToken = tokenStore!.getToken(loanTokenSymbol || '');
    const collateralToken = tokenStore!.getToken(collateralTokenSymbol || '');

    if (!loanToken || !collateralToken || !term) {
      // TODO: make custom alert
      alert(t('is_required', { key: 'loan token, collateral token or term' }));
      return;
    }

    const loanAssetPair = loanManagerStore!.getLoanAssetPair(
      loanTokenSymbol,
      collateralTokenSymbol,
    );

    if (!loanAssetPair) {
      // TODO: make custom alert
      alert(t('is_invalid', { key: 'loan pair' }));
      return;
    }

    const minCollateralRatio = `${convertWeiToDecimal(
      loanAssetPair.collateralRatio,
    ) * 100}%`;

    const collateralRatio = this.getCollateralRatio(
      loanAmount,
      collateralAmount,
      loanToken,
      collateralToken,
    );

    if (collateralRatio < minCollateralRatio) {
      return alert(t('must_be_greater_than', { key: 'collateral ratio' }));
    }

    // TODO: add input/checkbox field to use freed collateral
    const requestedFreedCollateral = 0;

    await transactionStore!.loan(
      Number.parseInt(term, 10),
      loanToken,
      collateralToken,
      convertDecimalToWei(loanAmount),
      convertDecimalToWei(collateralAmount),
      convertDecimalToWei(requestedFreedCollateral),
    );

    history.push(`/transactions?tokenSymbol=${loanToken.symbol}`);
  };

  renderOption(key: string, value: any, text?: string) {
    return (
      <option key={key} value={value}>
        {text ? text : value}
      </option>
    );
  }

  getCollateralRatio = (
    loanAmount: number,
    collateralAmount: number,
    loanToken: IToken,
    collateralToken: IToken,
  ) => {
    return (loanAmount === 0
      ? 0
      : ((collateralAmount * collateralToken!.price!) /
          loanAmount /
          loanToken!.price!) *
        100
    ).toFixed(2);
  };

  estimateRepayAmount(annualPercentageRate: number) {
    const { loanAmount } = this.state;
    const { term } = parseQuery(this.props.location.search);
    const termPercentageRate =
      (annualPercentageRate / 365) * Number.parseInt(term, 10);

    return loanAmount * (1 + termPercentageRate / 100);
  }

  render() {
    const {
      tokenStore,
      loanManagerStore,
      t,
      location: { search },
    } = this.props;
    const { term, loanTokenSymbol, collateralTokenSymbol } = parseQuery(search);
    const { loanAmount, collateralAmount } = this.state;

    const tokenSymbolList = tokenStore!.validTokens.map(
      (token: IToken) => token.symbol,
    );

    if (
      !loanTokenSymbol ||
      !collateralTokenSymbol ||
      !term ||
      loanTokenSymbol === collateralTokenSymbol
    ) {
      const defaultLoanSymbol = loanTokenSymbol || tokenSymbolList[0];
      const defaultCollateralSymbol =
        collateralTokenSymbol && loanTokenSymbol !== collateralTokenSymbol
          ? collateralTokenSymbol
          : loanManagerStore!.getCollateralSymbolsByLoanSymbol(
              defaultLoanSymbol,
            )[0];
      const defaultTerm = '30';
      this.updateQueryParams({
        loanTokenSymbol: defaultLoanSymbol,
        collateralTokenSymbol: defaultCollateralSymbol,
        term: defaultTerm,
      });
      return null;
    }
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
            loanToken!.loanAnnualPercentageRates[Number.parseInt(term!, 10)],
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
      currCollateralRatio = this.getCollateralRatio(
        loanAmount,
        collateralAmount,
        loanToken!,
        collateralToken!,
      );

      minCollateralRatio = `${convertWeiToDecimal(
        loanAssetPair.collateralRatio,
      ) * 100}%`;
    }

    const estimatedRepayDate = dayjs()
      .endOf('day')
      .add(Number.parseInt(term, 10), 'day')
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
                    onChange={this.handleSelectChange('loanTokenSymbol')}
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
                    step={1e-8}
                    min={1e-8}
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
                    onChange={this.handleSelectChange('term')}
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
                    onChange={this.handleSelectChange('collateralTokenSymbol')}
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
                    step={1e-8}
                    min={1e-8}
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

export default withTranslation()(withRouter(LoanPage));
