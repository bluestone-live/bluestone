import * as React from 'react';
import Card from '../components/common/Card';
import { withRouter, RouteComponentProps } from 'react-router';
import { inject, observer } from 'mobx-react';
import { updateState } from '../utils/updateState';
import {
  convertDecimalToWei,
  convertWeiToDecimal,
  BigNumber,
} from '../utils/BigNumber';
import { IToken } from '../constants/Token';
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
import {
  TokenStore,
  LoanManagerStore,
  RecordStore,
  ConfigurationStore,
  AccountStore,
} from '../stores';
import Toggle from '../components/common/Toggle';
import { stringify } from 'querystring';

interface IProps extends WithTranslation, RouteComponentProps {
  accountStore?: AccountStore;
  tokenStore?: TokenStore;
  loanManagerStore?: LoanManagerStore;
  recordStore?: RecordStore;
  configurationStore?: ConfigurationStore;
  term: number;
  availableTerms: number[];
  loanTokenSymbol: string;
  collateralTokenSymbol: string;
  onSelectChange: (
    key: string,
  ) => (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

interface IState {
  loanAmount: number;
  collateralAmount: number;
  useFreedCollateral: boolean;
  loading: boolean;
}

@inject(
  'accountStore',
  'tokenStore',
  'loanManagerStore',
  'recordStore',
  'configurationStore',
)
@observer
class LoanForm extends React.Component<IProps, IState> {
  state = {
    loanAmount: 0,
    collateralAmount: 0,
    useFreedCollateral: false,
    loading: false,
  };

  async componentDidMount() {
    await this.getFreedCollateral();
  }

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
    const { loanAmount, collateralAmount, useFreedCollateral } = this.state;
    const loanToken = tokenStore!.getToken(loanTokenSymbol || '');
    const collateralToken = tokenStore!.getToken(collateralTokenSymbol || '');

    this.setState({
      loading: true,
    });

    if (!loanToken || !collateralToken || !term) {
      // TODO: show error messages
      return;
    }

    const record = await recordStore!.loan(
      new BigNumber(term),
      loanToken,
      collateralToken,
      convertDecimalToWei(loanAmount),
      convertDecimalToWei(collateralAmount),
      useFreedCollateral,
    );
    this.setState({
      loading: false,
    });

    history.push({
      pathname: '/records/loan',
      search: stringify({
        currentToken: loanToken.address,
        recordAddress: record!.recordAddress,
      }),
    });
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

  getFreedCollateral = () => {
    const { accountStore, tokenStore, collateralTokenSymbol } = this.props;
    const collateralToken = tokenStore!.getToken(collateralTokenSymbol || '');

    if (!collateralToken) {
      return;
    }

    return accountStore!.getFreedCollateral(collateralToken);
  };

  onUseFreedCollateralChange = (useFreedCollateral: boolean) =>
    this.setState({
      useFreedCollateral,
    });

  renderFreedCollateral = (freedCollateral?: BigNumber) => {
    const { t } = this.props;

    return (
      <Row>
        <Form.Item>
          <Cell>
            <label htmlFor="">{t('use_freed_collateral')}</label>
          </Cell>
          <Cell>
            <Toggle
              defaultValue={this.state.useFreedCollateral}
              onChange={this.onUseFreedCollateralChange}
            />
          </Cell>
        </Form.Item>
        <Form.Item key="freed_collateral_amount">
          <Cell>
            <label>{t('freed_collateral_amount')}</label>
          </Cell>
          <Cell>
            <StyledTextBox>
              {convertWeiToDecimal(freedCollateral)}
            </StyledTextBox>
          </Cell>
        </Form.Item>
      </Row>
    );
  };

  render() {
    const {
      accountStore,
      tokenStore,
      loanManagerStore,
      configurationStore,
      t,
      term,
      availableTerms,
      loanTokenSymbol,
      collateralTokenSymbol,
      onSelectChange,
    } = this.props;
    const { loanAmount, collateralAmount, loading } = this.state;

    const tokenSymbolList = tokenStore!.validTokens.map(
      (token: IToken) => token.symbol,
    );

    const loanTokenOptions = tokenSymbolList.map(tokenSymbol =>
      this.renderOption(tokenSymbol, tokenSymbol),
    );

    const collateralTokenOptions = loanManagerStore!
      .getCollateralSymbolsByLoanSymbol(loanTokenSymbol)
      .map(tokenSymbol => this.renderOption(tokenSymbol, tokenSymbol));

    const termOptions = availableTerms.map(thisTerm =>
      this.renderOption(thisTerm.toString(), thisTerm),
    );

    const loanToken = tokenStore!.getToken(loanTokenSymbol);
    const collateralToken = tokenStore!.getToken(collateralTokenSymbol!);

    const interestRate = loanToken
      ? loanToken.loanAnnualPercentageRates
        ? loanToken!.loanAnnualPercentageRates[term]
        : new BigNumber(0)
      : new BigNumber(0);
    const annualPercentageRate = calculateRate(interestRate, RatePeriod.Annual);

    const loanAssetPair = loanManagerStore!.getLoanAssetPair(
      loanTokenSymbol,
      collateralTokenSymbol!,
    );

    let currCollateralRatio = '0';
    let minCollateralRatio = '0';

    if (loanAssetPair) {
      currCollateralRatio =
        loanAmount === 0
          ? '0'
          : `${(
              ((collateralAmount *
                Number.parseFloat(
                  convertWeiToDecimal(collateralToken!.price!),
                )) /
                this.estimateRepayAmount(
                  Number.parseInt(annualPercentageRate, 10),
                ) /
                Number.parseFloat(convertWeiToDecimal(loanToken!.price!))) *
              100
            ).toFixed(2)}%`;

      minCollateralRatio = `${(
        Number.parseFloat(
          convertWeiToDecimal(loanAssetPair.collateralRatio, 2),
        ) * 100
      ).toFixed(2)}%`;
    }

    const estimatedRepayDate = dayjs()
      .endOf('day')
      .add(term, 'day')
      .format('DD/MM/YYYY');

    if (!collateralToken) {
      return null;
    }

    const freedCollateral = accountStore!.getFreedCollateralByAddress(
      collateralToken!.address,
    );

    const couldUseFreedCollateral = freedCollateral
      ? Number.parseFloat(convertWeiToDecimal(freedCollateral)) !== 0
      : false;

    return (
      <div>
        <Card>
          <Form onSubmit={this.handleSubmit}>
            <Row>
              <Form.Item>
                <Cell>
                  <label htmlFor="loanTokenSymbol">{t('borrow')}:</label>
                </Cell>
                <Cell>
                  <Select
                    id="loanTokenSymbol"
                    name="loanTokenSymbol"
                    value={loanTokenSymbol}
                    onChange={onSelectChange('loanTokenSymbol')}
                  >
                    {loanTokenOptions}
                  </Select>
                </Cell>
              </Form.Item>
              <Form.Item>
                <Cell>
                  <label htmlFor="loanAmount">{t('amount')}:</label>
                </Cell>
                <Cell>
                  <Input
                    id="loanAmount"
                    name="loanAmount"
                    type="number"
                    step="any"
                    min="0"
                    onChange={this.handleChange}
                    value={loanAmount}
                  />
                </Cell>
              </Form.Item>
            </Row>
            <Row>
              <Form.Item>
                <Cell>
                  <label htmlFor="term">{t('term')}:</label>
                </Cell>
                <Cell>
                  <Select
                    id="term"
                    name="term"
                    value={term}
                    onChange={onSelectChange('term')}
                  >
                    {termOptions}
                  </Select>
                </Cell>
              </Form.Item>
              <Form.Item>
                <Cell>
                  <label htmlFor="apr">{t('apr')}:</label>{' '}
                </Cell>
                <Cell>
                  <StyledTextBox id="apr">
                    {annualPercentageRate}%
                  </StyledTextBox>
                </Cell>
              </Form.Item>
            </Row>
            <Row>
              <Form.Item>
                <Cell>
                  <label htmlFor="collateralTokenSymbol">
                    {t('collateral')}:
                  </label>
                </Cell>
                <Cell>
                  <Select
                    id="collateralTokenSymbol"
                    name="collateralTokenSymbol"
                    value={collateralTokenSymbol}
                    onChange={onSelectChange('collateralTokenSymbol')}
                  >
                    {collateralTokenOptions}
                  </Select>
                </Cell>
              </Form.Item>
              <Form.Item>
                <Cell>
                  <label htmlFor="collateralAmount">{t('amount')}:</label>
                </Cell>
                <Cell>
                  <Input
                    id="collateralAmount"
                    type="number"
                    name="collateralAmount"
                    step="any"
                    min="0"
                    value={collateralAmount}
                    onChange={this.handleChange}
                  />
                </Cell>
              </Form.Item>
            </Row>
            <Row>
              <Form.Item>
                <Cell>
                  <label htmlFor="collateralRatio">
                    {t('collateral_ratio')}:
                  </label>
                </Cell>
                <Cell>
                  <StyledTextBox id="collateralRatio">
                    {currCollateralRatio} % / {minCollateralRatio}
                  </StyledTextBox>
                </Cell>
              </Form.Item>
              <Form.Item>&nbsp;</Form.Item>
            </Row>
            {couldUseFreedCollateral &&
              this.renderFreedCollateral(freedCollateral)}
            {this.state.loanAmount > 0 ? (
              <Row>
                <Cell>
                  <Form.Item>
                    <StyledTextBox>
                      You need to pay back{' '}
                      {this.estimateRepayAmount(
                        Number.parseInt(annualPercentageRate, 10),
                      )}{' '}
                      {loanTokenSymbol} in estimation before{' '}
                      {estimatedRepayDate}.
                    </StyledTextBox>
                  </Form.Item>
                </Cell>
              </Row>
            ) : (
              ''
            )}
            <Row>
              <Form.Item>
                <Cell>
                  <Button
                    disabled={configurationStore!.isUserActionsLocked}
                    primary
                    fullWidth
                    loading={loading}
                  >
                    {t('loan')}
                  </Button>
                </Cell>
              </Form.Item>
            </Row>
          </Form>
        </Card>
      </div>
    );
  }
}

export default withTranslation()(withRouter(LoanForm));
