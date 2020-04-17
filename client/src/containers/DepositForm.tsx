import React, { useState, useCallback, useMemo } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { withRouter, RouteComponentProps } from 'react-router';
import {
  IPool,
  IToken,
  IBalance,
  CommonActions,
  AccountActions,
  useLoading,
  ViewActions,
  ETHIdentificationAddress,
  useLoadingType,
  LoadingType,
} from '../stores';
import FormInput from '../components/FormInput';
import TextBox from '../components/TextBox';
import dayjs from 'dayjs';
import Form from 'antd/lib/form';
import Button from 'antd/lib/button';
import { getService } from '../services';
import { convertDecimalToWei, convertWeiToDecimal } from '../utils/BigNumber';
import { useDispatch } from 'react-redux';
import { BannerType } from '../components/Banner';

interface IProps extends WithTranslation, RouteComponentProps {
  accountAddress: string;
  protocolContractAddress: string;
  distributorAddress: string;
  token: IToken;
  pool: IPool;
  tokenBalance: IBalance;
}

const DepositForm = (props: IProps) => {
  const {
    accountAddress,
    protocolContractAddress,
    distributorAddress,
    token,
    pool,
    tokenBalance,
    history,
    t,
  } = props;

  const dispatch = useDispatch();

  const loadingType = useLoadingType();

  // States
  const [depositAmount, setDepositAmount] = useState('0');

  // Callbacks
  const onDepositAmountChange = useCallback(
    (value: string) => {
      if (Number.parseFloat(value) < 0) {
        return;
      }
      const safeValue = Math.min(
        Number.parseFloat(convertWeiToDecimal(tokenBalance.balance)),
        Number.parseFloat(value),
      );
      setDepositAmount(`${safeValue}`);
    },
    [setDepositAmount],
  );

  const submit = useCallback(async () => {
    const {
      accountService,
      depositService,
      commonService,
    } = await getService();
    try {
      if (token.allowance && token.allowance.toString() === '0') {
        dispatch(ViewActions.setLoadingType(LoadingType.Approve));

        await commonService.approveFullAllowance(
          accountAddress,
          token,
          protocolContractAddress,
        );

        dispatch(
          CommonActions.setAllowance(
            token.tokenAddress,
            await commonService.getTokenAllowance(
              token,
              accountAddress,
              protocolContractAddress,
            ),
          ),
        );
      } else {
        dispatch(ViewActions.setLoadingType(LoadingType.Deposit));

        const recordId = await depositService.deposit(
          accountAddress,
          token.tokenAddress,
          convertDecimalToWei(depositAmount),
          pool.term.toString(),
          distributorAddress,
        );

        dispatch(
          AccountActions.setTokenBalance(
            token.tokenAddress,
            token.tokenAddress === ETHIdentificationAddress
              ? await accountService.getETHBalance(accountAddress)
              : await accountService.getTokenBalance(accountAddress, token),
          ),
        );

        dispatch(ViewActions.setBanner(t('common_deposit_succeed')));

        history.push(`/account/deposit/${recordId}`);
      }
      // Ignore the error
      // tslint:disable-next-line:no-empty
    } catch (e) {
      dispatch(
        ViewActions.setBanner(
          t('common_deposit_fail_title'),
          BannerType.Warning,
          t('common_deposit_fail_content'),
        ),
      );
    }
    dispatch(ViewActions.setLoadingType(LoadingType.None));
  }, [token, depositAmount, pool]);

  // Computed

  const buttonText = useMemo(() => {
    if (loadingType !== LoadingType.None) {
      return t(`common_loading_${loadingType}`);
    }
    if (token.allowance && token.allowance.toString() === '0') {
      return t('deposit_form_button_approve');
    }
    return t('deposit_form_button_deposit');
  }, [token, loadingType]);

  return (
    <div className="deposit-from">
      <Form>
        <FormInput
          label={t('deposit_form_input_amount')}
          suffix={token.tokenSymbol}
          type="number"
          size="large"
          value={depositAmount}
          onChange={onDepositAmountChange}
          extra={t('deposit_form_input_extra_balance', {
            balance: convertWeiToDecimal(tokenBalance.balance),
            unit: token.tokenSymbol,
          })}
        />
        <TextBox label={t('deposit_form_text_current_apr')}>
          {pool.APR}%
        </TextBox>
        <TextBox label={t('deposit_form_text_maturity_date')}>
          {dayjs
            .utc()
            .add(pool.term, 'day')
            .endOf('day')
            .local()
            .format('YYYY-MM-DD HH:mm')}
        </TextBox>
        <Button
          type="primary"
          block
          onClick={submit}
          disabled={
            loadingType !== LoadingType.None ||
            !depositAmount ||
            (depositAmount === '0' && token.allowance !== '0')
          }
        >
          {buttonText}
        </Button>
      </Form>
    </div>
  );
};

export default withTranslation()(withRouter(DepositForm));
