import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { TransactionStore } from '../stores';

interface IProps extends WithTranslation {
  transactionStore: TransactionStore;
}

@inject('transactionStore')
@observer
class DepositForm extends React.Component<IProps> {}

export default withTranslation()(DepositForm);
