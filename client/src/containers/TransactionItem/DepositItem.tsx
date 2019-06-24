import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { IDepositTransaction } from '../../constants/Transaction';
import { observer, inject } from 'mobx-react';

interface IProps extends WithTranslation {
  depositTransaction: IDepositTransaction;
}

@inject('transaction')
@observer
class DepositTransactionItem extends React.Component<IProps> {
  render() {
    return <div className="deposit-item">TX Item</div>;
  }
}

export default withTranslation()(DepositTransactionItem);
