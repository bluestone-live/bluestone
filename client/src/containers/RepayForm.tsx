import React, { useState, useCallback, useMemo } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  ILoanRecord,
  ILoanPair,
  ViewActions,
  useLoading,
  CommonActions,
} from '../stores';
import TextBox from '../components/TextBox';
import { convertWeiToDecimal, convertDecimalToWei } from '../utils/BigNumber';
import FormInput from '../components/FormInput';
import Form from 'antd/lib/form';
import Button from 'antd/lib/button';
import { getService } from '../services';
import { RouteComponentProps, withRouter } from 'react-router';
import { useDispatch } from 'react-redux';
import { BannerType } from '../components/Banner';

interface IProps extends WithTranslation, RouteComponentProps {
  accountAddress: string;
  protocolContractAddress: string;
  record: ILoanRecord;
  selectedLoanPair: ILoanPair;
}

const RepayForm = (props: IProps) => {
  const {
    accountAddress,
    protocolContractAddress,
    record,
    selectedLoanPair,
    history,
    t,
  } = props;
  const dispatch = useDispatch();

  const loading = useLoading();
  const [repayAmount, setRepayAmount] = useState('0');

  const onRepayAmountChange = useCallback(
    (value: string) => {
      const safeValue = Math.min(
        Number.parseFloat(value),
        Number.parseFloat(convertWeiToDecimal(record.remainingDebt, 18)),
      );
      setRepayAmount(`${safeValue}`);
    },
    [setRepayAmount],
  );

  const onRepayAmountMaxButtonClick = useCallback(() => {
    setRepayAmount(convertWeiToDecimal(record.remainingDebt, 18));
  }, [record]);

  const submit = useCallback(async () => {
    dispatch(ViewActions.setLoading(true));
    try {
      if (
        selectedLoanPair.loanToken.allowance &&
        selectedLoanPair.loanToken.allowance.toString() === '0'
      ) {
        const { commonService } = await getService();
        await commonService.approveFullAllowance(
          accountAddress,
          selectedLoanPair.loanToken,
          protocolContractAddress,
        );

        dispatch(
          CommonActions.setAllowance(
            selectedLoanPair.loanToken.tokenAddress,
            await commonService.getTokenAllowance(
              selectedLoanPair.loanToken,
              accountAddress,
              protocolContractAddress,
            ),
          ),
        );
      } else {
        const { loanService } = await getService();

        await loanService.repayLoan(
          accountAddress,
          record.recordId,
          convertDecimalToWei(repayAmount),
        );

        dispatch(ViewActions.setBanner(t('common_repay_succeed')));

        history.push(`/account/borrow/${record.recordId}`);
      }
      // Ignore the error
      // tslint:disable-next-line:no-empty
    } catch (e) {
      dispatch(
        ViewActions.setBanner(
          t(
            'common_repay_fail_title',
            BannerType.Warning,
            t('common_repay_fail_content'),
          ),
        ),
      );
    }
    dispatch(ViewActions.setLoading(false));
  }, [record, repayAmount, selectedLoanPair]);

  const buttonText = useMemo(() => {
    if (loading) {
      return t('common_loading');
    }
    if (
      selectedLoanPair.loanToken.allowance &&
      selectedLoanPair.loanToken.allowance.toString() === '0'
    ) {
      return t('borrow_form_button_approve');
    }
    return t('repay_form_button_repay');
  }, [loading, selectedLoanPair]);

  return (
    <div className="repay-form">
      <TextBox label={t('repay_form_label_remaining_debt')}>
        {convertWeiToDecimal(record.remainingDebt, 18)}{' '}
        {selectedLoanPair.loanToken.tokenSymbol}
      </TextBox>
      <TextBox label={t('repay_form_label_due_date')}>
        {record.dueAt.local().format('YYYY.MM.DD HH:mm')}
      </TextBox>
      <Form>
        <FormInput
          type="number"
          label={t('repay_form_input_label_repay')}
          value={repayAmount}
          onChange={onRepayAmountChange}
          suffix={selectedLoanPair.loanToken.tokenSymbol}
          actionButtons={[
            <Button key="max_btn" onClick={onRepayAmountMaxButtonClick}>
              {t('repay_form_input_button_max')}
            </Button>,
          ]}
        />

        <Button
          type="primary"
          block
          size="large"
          onClick={submit}
          disabled={loading}
        >
          {buttonText}
        </Button>
      </Form>
    </div>
  );
};

export default withTranslation()(withRouter(RepayForm));
