import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { TransactionStore, TokenStore } from '../stores';
import Card from '../components/common/Card';
import TransactionItem from '../containers/TransactionItem';
import Select from '../components/html/Select';
import Form from '../components/html/Form';
import { inject, observer } from 'mobx-react';
import { terms, ITerm } from '../constants/Term';
import { Row, Cell } from '../components/common/Layout';
import styled from 'styled-components';
import { RouteComponentProps, withRouter } from 'react-router';
import { TransactionStatus } from '../constants/Transaction';
import { IToken } from '../constants/Token';
import { updateState } from '../utils/updateState';
import { stringify, parse } from 'querystring';
import { toJS } from 'mobx';
import { getEnumValidKeys } from '../utils/getEnumValidKeys';

interface IProps extends WithTranslation, RouteComponentProps {
  tokenStore: TokenStore;
  transactionStore: TransactionStore;
}

interface IState {
  token?: IToken;
  term?: ITerm;
  status?: TransactionStatus;
}

const StyledHeaderCell = styled(Cell)`
  font-weight: bolder;
`;

@inject('tokenStore', 'transactionStore')
@observer
class TransactionListPage extends React.Component<IProps, IState> {
  state = {
    token: undefined,
    term: undefined,
    status: undefined,
  };

  async componentDidMount() {
    const { location, tokenStore, transactionStore } = this.props;
    const search = parse(location.search.replace(/\?/gi, ''));
    const token = search.tokenSymbol
      ? toJS(tokenStore.getToken(Array.from(search.tokenSymbol).join('')))
      : undefined;
    const term = search.term
      ? terms.find(
          t =>
            t.value === Number.parseInt(Array.from(search.term).join(''), 10),
        )
      : undefined;
    const status = search.status;
    if (token) {
      this.setState({
        token,
      });
    }
    if (term) {
      this.setState({
        term,
      });
    }
    if (status) {
      this.setState({
        status: Number.parseInt(Array.from(status).join(''), 10),
      });
    }
    await transactionStore.getDepositTransactions();
  }

  onSelectChange = (key: keyof IState) => (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    let value: number | ITerm | IToken | undefined;
    if (key === 'token') {
      value = toJS(
        this.props.tokenStore.validTokens.find(
          t => t.address === e.currentTarget.value,
        ),
      );
    } else if (key === 'term') {
      value = terms.find(
        t => t.value === Number.parseInt(e.currentTarget.value, 10),
      );
    } else if (key === 'status') {
      value = Number.parseInt(e.currentTarget.value, 10);
    }
    if (!value) {
      return;
    }
    this.setState(
      updateState<IToken | ITerm | TransactionStatus, IState>(key, value),
      () => {
        // tslint:disable-next-line:prefer-object-spread
        const { token, term, status } = Object.assign({}, this.state, {
          [key]: value,
        });
        this.props.history.push({
          pathname: window.location.pathname,
          search: stringify({
            tokenSymbol: (token || { symbol: '' }).symbol,
            term: (term || { value: '' }).value,
            status,
          }),
        });
      },
    );
  };

  render() {
    const { tokenStore, transactionStore, t } = this.props;

    const token = this.state.token || { address: undefined };
    const term = this.state.term || { value: undefined };
    const status = this.state.status;

    return (
      <Card>
        <div className="filters">
          <Form.Item>
            <label htmlFor="token-filter">{t('token')}</label>
            <Select
              id="token-filter"
              value={token.address}
              onChange={this.onSelectChange('token')}
            >
              <option value={undefined}>{t('all')}</option>
              {tokenStore.validTokens.map(tokenOption => (
                <option
                  key={`token-filter-${tokenOption.address}`}
                  value={tokenOption.address}
                >
                  {tokenOption.symbol}
                </option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <label htmlFor="term-filter">{t('term')}</label>
            <Select
              value={term.value}
              id="term-filter"
              onChange={this.onSelectChange('term')}
            >
              <option value={undefined}>{t('all')}</option>
              {terms.map(termOption => (
                <option
                  key={`token-filter-${termOption.value}`}
                  value={termOption.value}
                >
                  {termOption.text}
                </option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <label htmlFor="status-filter">{t('transaction_status')}</label>
            <Select
              id="status-filter"
              value={status}
              onChange={this.onSelectChange('status')}
            >
              <option value={undefined}>{t('all')}</option>
              {getEnumValidKeys(TransactionStatus).map(k => (
                <option key={`status-filter-${k}`} value={k}>
                  {TransactionStatus[Number.parseInt(k, 10)]}
                </option>
              ))}
              ))}
            </Select>
          </Form.Item>
        </div>
        <div className="tx-list">
          <Row>
            <StyledHeaderCell>{t('token')!}</StyledHeaderCell>
            <StyledHeaderCell>{t('type')!}</StyledHeaderCell>
            <StyledHeaderCell>{t('amount')!}</StyledHeaderCell>
            <StyledHeaderCell>{t('status')!}</StyledHeaderCell>
            <StyledHeaderCell>{t('actions')!}</StyledHeaderCell>
          </Row>
          {transactionStore.transactions.map(tx => (
            <TransactionItem
              transactionStore={transactionStore}
              key={tx.transactionAddress}
              transaction={tx}
            />
          ))}
        </div>
      </Card>
    );
  }
}

export default withTranslation()(withRouter(TransactionListPage));
