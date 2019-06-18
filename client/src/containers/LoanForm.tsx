import * as React from 'react';
import Form from '../components/html/Form';
import Button from '../components/html/Button';
import Input from '../components/html/Input';
import styled from 'styled-components';
import { withTranslation, WithTranslation } from 'react-i18next';
import { observer, inject } from 'mobx-react';
import { TokenStore, IToken } from '../stores';

interface IProps extends WithTranslation {
  tokenStore: TokenStore;
  term?: number;
  loanTokenSymbol?: string;
  collateralTokenSymbol?: string;
}

interface IState {
  term: number;
  loanTokenSymbol: string;
  collateralTokenSymbol: string;
}

// Modified from: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/26635#issuecomment-400260278
const updateState = <T extends string>(key: string, value: T) => (
  prevState: IState,
): IState => ({
  ...prevState,
  [key]: value,
});

const StyledColumns = styled.div`
  display: flex;
`;

@observer
@inject('tokenStore')
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
    };
  }

  handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.currentTarget;

    this.setState(updateState(name, value));
  };

  handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  renderOption(key: string, value: any, text?: string) {
    return (
      <option key={key} value={value}>
        {text ? text : value}
      </option>
    );
  }

  render() {
    const { tokenStore, t } = this.props;
    const { term, loanTokenSymbol, collateralTokenSymbol } = this.state;

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

    return (
      <Form onSubmit={this.handleSubmit}>
        <StyledColumns>
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
          <Form.Item>
            <label htmlFor="loanAmount">{t('amount')}:</label>
            <Input id="loanAmount" type="number" min="0" />
          </Form.Item>
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
          <Form.Item>DPR: TODO</Form.Item>
        </StyledColumns>

        <StyledColumns>
          <Form.Item>
            <label>
              {t('collateral')}:
              <select
                name="collateralTokenSymbol"
                value={collateralTokenSymbol}
                onChange={this.handleSelectChange}
              >
                {collateralTokenOptions}
              </select>
            </label>
          </Form.Item>
          <Form.Item>
            <label htmlFor="collateralAmount">{t('amount')}:</label>
            <Input id="collateralAmount" type="number" min="0" />
          </Form.Item>
          <Form.Item>Collateral Ratio: TODO</Form.Item>
        </StyledColumns>

        <Form.Item>
          <span>
            You need to pay back TODO-amount {loanTokenSymbol} before TODO-date.
          </span>
        </Form.Item>

        <Form.Item>
          <Button primary>{t('loan')}</Button>
        </Form.Item>
      </Form>
    );
  }
}

export default withTranslation()(LoanForm);
