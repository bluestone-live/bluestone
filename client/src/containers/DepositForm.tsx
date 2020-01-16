import React, { useState, useCallback, ChangeEvent, useMemo } from 'react';
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
} from '../stores';
import FormInput from '../components/FormInput';
import TextBox from '../components/TextBox';
import dayjs from 'dayjs';
import Form from 'antd/lib/form';
import Button from 'antd/lib/button';
import { getService } from '../services';
import { convertDecimalToWei, convertWeiToDecimal } from '../utils/BigNumber';
import { useDispatch } from 'react-redux';

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

  // Selectors
  const loading = useLoading();

  // States
  const [depositAmount, setDepositAmount] = useState();

  // Callbacks
  const onDepositAmountChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setDepositAmount(e.target.value),
    [setDepositAmount],
  );

  const submit = useCallback(async () => {
    const {
      accountService,
      depositService,
      commonService,
    } = await getService();
    dispatch(ViewActions.setLoading(true));
    if (token.allowance && token.allowance.toString() === '0') {
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
          await accountService.getTokenBalance(accountAddress, token),
        ),
      );

      history.push(`/account/deposit/${recordId}`);
    }
    dispatch(ViewActions.setLoading(false));
  }, [token, depositAmount, pool]);

  // Computed

  const buttonText = useMemo(() => {
    if (loading) {
      return t('common_loading');
    }
    if (token.allowance && token.allowance.toString() === '0') {
      return t('deposit_form_button_approve');
    }
    return t('deposit_form_button_deposit');
  }, [loading, token]);

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
          {dayjs()
            .add(pool.term, 'day')
            .endOf('day')
            .format('YYYY-MM-DD HH:mm ZZ')}
        </TextBox>
        <Button type="primary" block onClick={submit} disabled={loading}>
          {buttonText}
        </Button>
      </Form>
    </div>
  );
};

export default withTranslation()(withRouter(DepositForm));
