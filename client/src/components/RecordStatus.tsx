import React, { useMemo } from 'react';
import { RecordType, IRecord, IDepositRecord, ILoanRecord } from '../stores';
import Form from 'antd/lib/form';

interface IProps {
  record: IRecord;
}

const RecordStatus = (props: IProps) => {
  const { record } = props;

  const currentPoolID = useMemo(() => {
    return Math.floor(new Date().valueOf() / 1000 / 3600 / 24);
  }, [new Date().getUTCDate()]);

  const content = useMemo(() => {
    if (record.recordType === RecordType.Deposit) {
      const depositRecord = record as IDepositRecord;
      if (depositRecord.isMatured) {
        return <span className="ant-form-text matured">Matured</span>;
      } else if (depositRecord.isWithdrawn) {
        return <span className="ant-form-text closed">Closed</span>;
      }
      return (
        <span className="ant-form-text">
          Mature in{' '}
          {Number.parseInt(depositRecord.maturedPoolID, 10) - currentPoolID}
          days
        </span>
      );
    } else {
      const loanRecord = record as ILoanRecord;
      if (loanRecord.isClosed) {
        return <span className="ant-form-text closed">Closed</span>;
      } else if (loanRecord.isOverDue) {
        return <span className="ant-form-text overdue">Overdue</span>;
      }
      // TODO(ZhangRGK): Due in days = OverDue Pool ID - Current Pool ID. I will replace the hard code after contract modified
      return <span className="ant-form-text">Due in {8} days</span>;
    }
  }, [record]);

  return (
    <Form.Item label="Status" className="record-status">
      {content}
    </Form.Item>
  );
};

export default RecordStatus;
