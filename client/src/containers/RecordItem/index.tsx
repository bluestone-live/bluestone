import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  IRecord,
  IDepositRecord,
  ILoanRecord,
  RecordType,
} from '../../constants/Record';
import { observer } from 'mobx-react';
import DepositItem from './DepositItem';
import LoanItem from './LoanItem';
import { RecordStore } from '../../stores';

interface IProps extends WithTranslation {
  record: IRecord;
  recordStore: RecordStore;
}

@observer
class RecordItem extends React.Component<IProps> {
  render() {
    const { record, recordStore } = this.props;
    if (record.type === RecordType.Deposit) {
      return (
        <DepositItem
          recordStore={recordStore}
          depositRecord={record as IDepositRecord}
        />
      );
    }
    return <LoanItem loanRecord={record as ILoanRecord} />;
  }
}

export default withTranslation()(RecordItem);
