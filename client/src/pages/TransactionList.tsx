import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { TransactionStore, TokenStore } from '../stores';
import Card from '../components/common/Card';
import TransactionItem from '../containers/TransactionItem';
import Select from '../components/html/Select';
import Form from '../components/html/Form';
import { inject, observer } from 'mobx-react';
import { terms } from '../constants/Term';

interface IProps extends WithTranslation {
  tokenStore: TokenStore;
  transactionStore: TransactionStore;
}

@inject('tokenStore', 'transactionStore')
@observer
class TransactionList extends React.Component<IProps> {
  async componentDidMount() {
    await this.props.transactionStore.getDepositTransactions();
  }

  render() {
    const { tokenStore, transactionStore, t } = this.props;

    return (
      <Card>
        <div className="filters">
          <Form.Item>
            <label htmlFor="token-filter">{t('token')}</label>
            <Select id="token-filter">
              {tokenStore.validTokens.map(token => (
                <option
                  key={`token-filter-${token.address}`}
                  value={token.address}
                >
                  {token.symbol}
                </option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <label htmlFor="term-filter">{t('term')}</label>
            <Select id="term-filter">
              {terms.map(term => (
                <option key={`token-filter-${term.value}`} value={term.value}>
                  {term.text}
                </option>
              ))}
            </Select>
          </Form.Item>
          {
            // TODO need a status or type select here
          }
        </div>
        <div className="tx-list">
          {transactionStore.transactions.map(tx => (
            <TransactionItem key={tx.transactionId} transaction={tx} />
          ))}
        </div>
      </Card>
    );
  }
}

export default withTranslation()(TransactionList);
