import React, { useMemo } from 'react';
import { RecordType, IRecord, IDepositRecord, ILoanRecord } from '../stores';
import Form from 'antd/lib/form';
import { getCurrentPoolId } from '../utils/poolIdCalculator';
import { WithTranslation, withTranslation } from 'react-i18next';

interface IProps extends WithTranslation {
  record: IRecord;
}

const RecordStatus = (props: IProps) => {
  const { record, t } = props;

  const content = useMemo(() => {
    if (record.recordType === RecordType.Deposit) {
      const depositRecord = record as IDepositRecord;
      const currentPoolID = getCurrentPoolId();
      if (depositRecord.isWithdrawn) {
        return (
          <span className="ant-form-text closed">
            {t('record_status_text_closed')}
          </span>
        );
      } else if (depositRecord.isMatured) {
        return (
          <span className="ant-form-text matured">
            {t('record_status_text_matured')}
          </span>
        );
      }
      return (
        <span className="ant-form-text">
          {t('record_status_text_matured_in', {
            days: Number.parseInt(depositRecord.poolId, 10) - currentPoolID,
          })}
        </span>
      );
    } else {
      const loanRecord = record as ILoanRecord;
      if (loanRecord.isClosed) {
        return (
          <span className="ant-form-text closed">
            {t('record_status_text_closed')}
          </span>
        );
      } else if (loanRecord.isOverDue) {
        return (
          <span className="ant-form-text overdue">
            {t('record_status_text_overdue')}
          </span>
        );
      }
      return (
        <span className="ant-form-text">
          {t('record_status_text_due_in', {
            days: loanRecord.dueAt.diff(loanRecord.createdAt, 'day'),
          })}
        </span>
      );
    }
  }, [record]);

  return (
    <Form.Item label="Status" className="record-status">
      {content}
    </Form.Item>
  );
};

export default withTranslation()(RecordStatus);
