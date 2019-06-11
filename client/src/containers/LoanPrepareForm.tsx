import * as React from 'react';
import Form from '../components/html/Form';
import Button from '../components/html/Button';
import { withTranslation, WithTranslation } from 'react-i18next';
import { observer, inject } from 'mobx-react';
import { TokenStore } from '../stores';

interface IProps extends WithTranslation {
  tokenSymbol: string;
  tokenStore?: TokenStore;
}

@observer
@inject('tokenStore')
class LoanPrepareForm extends React.Component<IProps> {
  async componentDidMount() {
    const { tokenSymbol, tokenStore } = this.props;
    await tokenStore!.loadTokenIfNeeded(tokenSymbol);
  }

  handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // TODO: redirect to loan details page
  }

  render() {
    const { tokenSymbol, t } = this.props;
    const loanTerms = [1, 7, 30];

    return (
      <Form horizontal onSubmit={this.handleSubmit}>
        <Form.Item>{tokenSymbol}</Form.Item>
        <Form.Item>
          <select>
            <option value="">{t('select_a_term')}</option>
            {loanTerms.map((term, id) => (
              <option key={id} value={term}>{`${term} ${t('day')}`}</option>
            ))}
          </select>
        </Form.Item>

        <Form.Item>{/* TODO: available to borrow */}</Form.Item>

        <Form.Item>{/* TODO: DPR */}</Form.Item>

        <Button primary>{t('loan')}</Button>
      </Form>
    );
  }
}

export default withTranslation()(LoanPrepareForm);
