import React, { useState, useCallback, useMemo } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  ILoanRecord,
  ILoanPair,
  ViewActions,
  CommonActions,
  useLoadingType,
  LoadingType,
  useDepositTokens,
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
import { getTimezone } from '../utils/formatSolidityTime';

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

  const loadingType = useLoadingType();
  const [repayAmount, setRepayAmount] = useState('');
  const [illegalAmount, setIllegalAmount] = useState(true);
  const tokens = useDepositTokens();
  const decimals = tokens.find(
    token => token.tokenAddress === record.loanTokenAddress,
  )!.decimals;

  const onRepayAmountChange = useCallback(
    (value: string) => {
      const isNan = /^(\d+\.?\d*|\.\d+)$/.test(value) === false;

      const safeValue = Math.min(
        Number.parseFloat(value),
        Number.parseFloat(
          convertWeiToDecimal(record.remainingDebt, 18, decimals),
        ),
      );

      const amount = Number.parseFloat(value);

      setIllegalAmount(amount < safeValue || amount > safeValue || isNan);
      setRepayAmount(value);
    },
    [setRepayAmount],
  );

  const onRepayAmountMaxButtonClick = useCallback(() => {
    setIllegalAmount(false);

    setRepayAmount(
      convertWeiToDecimal(
        record.remainingDebt,
        Number.parseInt(`${selectedLoanPair.loanToken.decimals || 18}`, 10),
        selectedLoanPair.loanToken.decimals,
      ),
    );
  }, [record]);

  const submit = useCallback(async () => {
    dispatch(ViewActions.setLoadingType(LoadingType.Repay));
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
          convertDecimalToWei(repayAmount, selectedLoanPair.loanToken.decimals),
          record.loanTokenAddress,
        );

        dispatch(ViewActions.setBanner(t('common_repay_succeed')));

        history.push(`/account/borrow/${record.recordId}`);
      }
      // Ignore the error
      // tslint:disable-next-line:no-empty
    } catch (e) {
      dispatch(
        ViewActions.setBanner(
          t('common_repay_fail_title'),
          BannerType.Warning,
          e.message,
        ),
      );
    }
    dispatch(ViewActions.setLoadingType(LoadingType.None));
  }, [record, repayAmount, selectedLoanPair]);

  const buttonText = useMemo(() => {
    if (loadingType !== LoadingType.None) {
      return t(`common_loading_${loadingType}`);
    }
    if (
      selectedLoanPair.loanToken.allowance &&
      selectedLoanPair.loanToken.allowance.toString() === '0'
    ) {
      return t('borrow_form_button_approve');
    }
    return t('repay_form_button_repay');
  }, [selectedLoanPair, loadingType]);

  return (
    <div className="repay-form">
      <TextBox label={t('repay_form_label_remaining_debt')}>
        {convertWeiToDecimal(
          record.remainingDebt,
          Number.parseInt(selectedLoanPair.loanToken.decimals, 10),
          selectedLoanPair.loanToken.decimals,
        )}{' '}
        {selectedLoanPair.loanToken.tokenSymbol}
      </TextBox>
      <TextBox label={`${t('repay_form_label_due_date')} (${getTimezone()})`}>
        {record.dueAt.local().format('YYYY.MM.DD HH:mm')}
      </TextBox>
      <Form>
        <FormInput
          type="text"
          label={t('repay_form_input_label_repay')}
          value={repayAmount}
          placeholder="0.00"
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
          size="default"
          onClick={submit}
          loading={loadingType === LoadingType.Repay}
          disabled={
            illegalAmount ||
            loadingType !== LoadingType.None ||
            repayAmount === '0' ||
            !repayAmount
          }
        >
          {buttonText}
        </Button>
      </Form>
    </div>
  );
};

export default withTranslation()(withRouter(RepayForm));
