import React, { useState, useCallback } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { ILoanRecord, ILoanPair, ViewActions } from '../stores';
import TextBox from '../components/TextBox';
import { convertWeiToDecimal, convertDecimalToWei } from '../utils/BigNumber';
import FormInput from '../components/FormInput';
import Form from 'antd/lib/form';
import Button from 'antd/lib/button';
import { getService } from '../services';
import { RouteComponentProps, withRouter } from 'react-router';
import { useDispatch } from 'react-redux';

interface IProps extends WithTranslation, RouteComponentProps {
  accountAddress: string;
  record: ILoanRecord;
  selectedLoanPair: ILoanPair;
}

const RepayForm = (props: IProps) => {
  const { accountAddress, record, selectedLoanPair, history, t } = props;
  const dispatch = useDispatch();

  const [repayAmount, setRepayAmount] = useState(0);

  const onRepayAmountChange = useCallback(
    (value: string) => {
      setRepayAmount(Number.parseFloat(value));
    },
    [setRepayAmount],
  );

  const submit = useCallback(async () => {
    dispatch(ViewActions.setLoading(true));
    try {
      const { loanService } = await getService();

      await loanService.repayLoan(
        accountAddress,
        record.recordId,
        convertDecimalToWei(repayAmount),
      );

      history.push(`/account/borrow/${record.recordId}`);
      // Ignore the error
      // tslint:disable-next-line:no-empty
    } catch (e) {}
    dispatch(ViewActions.setLoading(false));
  }, [record, repayAmount]);

  return (
    <div className="repay-form">
      <TextBox label={t('repay_form_label_remaining_debt')}>
        {convertWeiToDecimal(record.remainingDebt, 18)}{' '}
        {selectedLoanPair.loanToken.tokenSymbol}
      </TextBox>
      <TextBox label={t('repay_form_label_due_date')}>
        {record.dueAt.format('YYYY.MM.DD HH:mm ZZ')}
      </TextBox>
      <Form>
        <FormInput
          type="text"
          label={t('repay_form_input_label_repay')}
          value={repayAmount}
          onChange={onRepayAmountChange}
          suffix={selectedLoanPair.loanToken.tokenSymbol}
        />

        <Button type="primary" block size="large" onClick={submit}>
          {t('repay_form_button_repay')}
        </Button>
      </Form>
    </div>
  );
};

export default withTranslation()(withRouter(RepayForm));
