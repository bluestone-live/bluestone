import React, { useState, useCallback, ChangeEvent } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { ILoanRecord, ILoanPair } from '../stores';
import TextBox from '../components/TextBox';
import { convertWeiToDecimal, convertDecimalToWei } from '../utils/BigNumber';
import FormInput from '../components/FormInput';
import Form from 'antd/lib/form';
import Button from 'antd/lib/button';
import { getService } from '../services';

interface IProps extends WithTranslation {
  accountAddress: string;
  record: ILoanRecord;
  selectedLoanPair: ILoanPair;
}

const RepayForm = (props: IProps) => {
  const { accountAddress, record, selectedLoanPair, t } = props;

  const [repayAmount, setRepayAmount] = useState(0);

  const onRepayAmountChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setRepayAmount(Number.parseFloat(e.target.value));
    },
    [setRepayAmount],
  );

  const submit = useCallback(async () => {
    const { loanService } = await getService();

    await loanService.repayLoan(
      accountAddress,
      record.recordId,
      convertDecimalToWei(repayAmount),
    );
  }, [record, repayAmount]);

  return (
    <div className="repay-form">
      <TextBox label={t('repay_form_label_remaining_debt')}>
        {convertWeiToDecimal(record.remainingDebt)}{' '}
        {selectedLoanPair.loanToken.tokenSymbol}
      </TextBox>
      <TextBox label={t('repay_form_label_due_date')}>
        {record.createdAt + record.loanTerm.value}
      </TextBox>
      <Form>
        <FormInput
          type="text"
          label={t('repay_form_input_label_repay')}
          value={repayAmount}
          onChange={onRepayAmountChange}
          suffix={selectedLoanPair.loanToken.tokenSymbol}
        />

        <Button type="primary" block size="large" onChange={submit}>
          {t('repay_form_button_repay')}
        </Button>
      </Form>
    </div>
  );
};

export default withTranslation()(RepayForm);
