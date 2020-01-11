import React, { useState, useCallback, ChangeEvent } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { withRouter, RouteComponentProps } from 'react-router';
import { IPool, IToken, IBalance } from '../stores';
import FormInput from '../components/FormInput';
import TextBox from '../components/TextBox';
import dayjs from 'dayjs';
import Form from 'antd/lib/form';
import Button from 'antd/lib/button';
import { getService } from '../services';
import { convertDecimalToWei, BigNumber } from '../utils/BigNumber';

interface IProps extends WithTranslation, RouteComponentProps {
  accountAddress: string;
  distributorAddress: string;
  token: IToken;
  pool: IPool;
  tokenBalance: IBalance;
}

const DepositForm = (props: IProps) => {
  const {
    accountAddress,
    distributorAddress,
    token,
    pool,
    tokenBalance,
    t,
  } = props;

  // States
  const [depositAmount, setDepositAmount] = useState();

  // Callbacks
  const onDepositAmountChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setDepositAmount(e.target.value),
    [setDepositAmount],
  );

  const submit = useCallback(async () => {
    const { depositService } = await getService();

    await depositService.deposit(
      accountAddress,
      token.tokenAddress,
      convertDecimalToWei(depositAmount),
      new BigNumber(pool.term),
      distributorAddress,
    );
  }, [depositAmount, pool]);

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
            balance: tokenBalance.balance.toString(),
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
        <Button type="primary" block onClick={submit}>
          {t('deposit_form_button_deposit')}
        </Button>
      </Form>
    </div>
  );
};

export default withTranslation()(withRouter(DepositForm));
