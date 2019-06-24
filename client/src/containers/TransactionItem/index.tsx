import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { ITransaction } from '../../constants/Transaction';
import { observer, inject } from 'mobx-react';

interface IProps extends WithTranslation {
  transaction: ITransaction;
}

@inject('transaction')
@observer
class TransactionItem extends React.Component<IProps> {
  render() {
    return <div className="tx-item">TX Item</div>;
  }
}

export default withTranslation()(TransactionItem);
