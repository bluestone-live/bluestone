import React, { useState, useCallback, ChangeEvent, useMemo } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  IBalance,
  ILoanPair,
  IToken,
  PoolActions,
  AccountActions,
  IPool,
} from '../stores';
import Form from 'antd/lib/form';
import FormInput from '../components/FormInput';
import Button from 'antd/lib/button';
import Select from 'antd/lib/select';
import { convertWeiToDecimal, convertDecimalToWei } from '../utils/BigNumber';
import { useDepsUpdated } from '../utils/useEffectAsync';
import { getService } from '../services';
import { useDispatch } from 'react-redux';
import { calcEstimateRepayAmount } from '../utils/calcEstimateRepayAmount';
import TextBox from '../components/TextBox';
import dayjs from 'dayjs';

interface IProps extends WithTranslation {
  accountAddress: string;
  loanToken?: IToken;
  loanPairs: ILoanPair[];
  tokenBalance: IBalance[];
  selectedPool?: IPool;
  distributorAddress: string;
  loading: boolean;
}

const BorrowForm = (props: IProps) => {
  const {
    accountAddress,
    loanToken,
    loanPairs,
    tokenBalance,
    selectedPool,
    loading,
    distributorAddress,
    t,
  } = props;
  const dispatch = useDispatch();

  // States
  const [borrowAmount, setBorrowAmount] = useState<number>(0);
  const [collateralToken, setCollateralToken] = useState<IToken>();
  const [collateralRatio, setCollateralRatio] = useState<number>(0);
  const [collateralAmount, setCollateralAmount] = useState<number>(0);

  // Initialize
  useDepsUpdated(async () => {
    if (loanToken) {
      const { poolService } = await getService();

      dispatch(
        PoolActions.replacePools(
          loanToken.tokenAddress,
          await poolService.getPoolsByToken(loanToken.tokenAddress),
        ),
      );
    }
  }, [loanToken]);

  const selectedBalance = useMemo(() => {
    if (collateralToken) {
      return tokenBalance.find(
        b => b.tokenAddress === collateralToken.tokenAddress,
      );
    }
  }, [tokenBalance, collateralToken]);

  useDepsUpdated(async () => {
    if (!loanToken || !!collateralToken) {
      return;
    }
    const defaultLoanPairs = loanPairs.filter(
      pair => pair.loanToken.tokenAddress === loanToken.tokenAddress,
    );
    if (defaultLoanPairs.length === 0) {
      return;
    }
    setCollateralToken(defaultLoanPairs[0].collateralToken);
  }, [loanPairs, loanToken]);

  useDepsUpdated(async () => {
    const { accountService } = await getService();
    if (collateralToken && accountAddress) {
      dispatch(
        AccountActions.setTokenBalance(
          collateralToken.tokenAddress,
          await accountService.getTokenBalance(accountAddress, collateralToken),
        ),
      );
    }
  }, [collateralToken, accountAddress]);

  // Callbacks
  const onBorrowAmountChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      setBorrowAmount(Number.parseFloat(e.target.value)),
    [setBorrowAmount],
  );

  const onBorrowAmountMaxButtonClick = useCallback(() => {
    if (selectedBalance) {
      setBorrowAmount(
        Number.parseFloat(convertWeiToDecimal(selectedBalance.balance)),
      );
    }
  }, [selectedBalance]);

  const onCollateralRatioChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      setCollateralRatio(Number.parseFloat(e.target.value)),
    [],
  );

  const modifyCollateralRatio = useCallback(
    (num: number) => () => setCollateralRatio(collateralRatio + num),
    [collateralRatio],
  );

  const onCollateralAmountChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      setCollateralAmount(Number.parseFloat(e.target.value)),
    [setCollateralAmount],
  );

  const submit = useCallback(async () => {
    if (!loanToken || !collateralToken || !selectedPool) {
      return;
    }
    const { loanService } = await getService();
    loanService.loan(
      accountAddress,
      loanToken.tokenAddress,
      collateralToken.tokenAddress,
      convertDecimalToWei(borrowAmount),
      convertDecimalToWei(collateralAmount),
      selectedPool.term,
      distributorAddress,
    );
  }, [
    loanToken,
    collateralToken,
    selectedPool,
    accountAddress,
    borrowAmount,
    collateralAmount,
    distributorAddress,
  ]);

  // Computed
  const selectedLoanPair = useMemo(() => {
    if (loanPairs.length > 0 && loanToken && collateralToken) {
      return loanPairs.find(
        pair =>
          pair.loanToken.tokenAddress === loanToken.tokenAddress &&
          pair.collateralToken.tokenAddress === collateralToken.tokenAddress,
      );
    }
  }, [loanPairs, loanToken, collateralToken]);

  useDepsUpdated(async () => {
    if (selectedLoanPair) {
      setCollateralRatio(
        Number.parseFloat(
          convertWeiToDecimal(selectedLoanPair.minCollateralCoverageRatio),
        ) * 100,
      );
    }
  }, [selectedLoanPair]);

  const availableCollateralTokens = useMemo(() => {
    if (loanToken) {
      return loanPairs
        .filter(pair => pair.loanToken.tokenAddress === loanToken.tokenAddress)
        .map(pair => pair.collateralToken);
    }
    return [];
  }, [loanPairs, loanToken]);

  const onCollateralTokenChange = useCallback(
    (tokenAddress: string) =>
      setCollateralToken(
        availableCollateralTokens.find(
          token => token.tokenAddress === tokenAddress,
        ),
      ),
    [availableCollateralTokens],
  );

  const totalDebt = useMemo(() => {
    if (selectedLoanPair && selectedPool) {
      return calcEstimateRepayAmount(
        borrowAmount,
        selectedPool.term,
        Number.parseFloat(
          convertWeiToDecimal(selectedLoanPair.annualPercentageRate) || '0',
        ),
      ).toFixed(4);
    }
  }, [selectedLoanPair, borrowAmount, selectedPool]);

  const buttonText = useMemo(() => {
    if (loading) {
      return t('common_loading');
    }
    if (
      collateralToken &&
      collateralToken.allowance &&
      collateralToken.allowance.toString() === '0'
    ) {
      return t('borrow_form_button_approve');
    }
    return t('borrow_form_button_borrow');
  }, [loading, collateralToken]);

  return (
    <Form>
      {loanToken && selectedBalance && (
        <FormInput
          label={t('borrow_form_input_label_borrow_amount')}
          type="number"
          suffix={loanToken.tokenSymbol}
          defaultValue={borrowAmount}
          value={borrowAmount}
          onChange={onBorrowAmountChange}
          extra={t('borrow_form_input_extra_available_amount', {
            balance: convertWeiToDecimal(
              selectedPool ? selectedPool.availableAmount : '0',
            ),
            unit: loanToken.tokenSymbol,
          })}
          actionButtons={[
            <Button key="max_btn" onClick={onBorrowAmountMaxButtonClick}>
              {t('borrow_form_input_button_max')}
            </Button>,
          ]}
        />
      )}
      {loanToken && loanPairs && collateralToken && (
        <Form.Item label={t('borrow_form_select_label_collateral_token')}>
          <Select
            onChange={onCollateralTokenChange}
            value={collateralToken.tokenAddress}
          >
            {availableCollateralTokens.map(token => (
              <Select.Option
                key={`collateral-token-${token.tokenAddress}`}
                value={token.tokenAddress}
              >
                {token.tokenSymbol}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      )}
      {selectedLoanPair && (
        <FormInput
          label={t('borrow_form_input_label_collateral_ratio')}
          type="text"
          value={`${collateralRatio}%`}
          onChange={onCollateralRatioChange}
          actionButtons={[
            <Button
              key="collateral_ratio_minus"
              onClick={modifyCollateralRatio(-10)}
            >
              -10%
            </Button>,
            <Button
              key="collateral_ratio_plus"
              onClick={modifyCollateralRatio(10)}
            >
              +10%
            </Button>,
          ]}
          tip={{
            title: t('borrow_form_tip_title'),
            content: (
              <div>
                {t('borrow_form_tip_content', {
                  minCollateralCoverageRatio:
                    Number.parseFloat(
                      convertWeiToDecimal(
                        selectedLoanPair.minCollateralCoverageRatio,
                      ),
                    ) * 100,
                })}
              </div>
            ),
          }}
        />
      )}
      {collateralToken && (
        <FormInput
          label={t('borrow_form_input_label_collateral_amount')}
          type="text"
          value={collateralAmount}
          onChange={onCollateralAmountChange}
          suffix={collateralToken.tokenSymbol}
          extra={
            <span className="bold">
              {t('borrow_form_input_extra_price', {
                price: convertWeiToDecimal(collateralToken.price, 2),
              })}
            </span>
          }
        />
      )}
      <TextBox label={t('borrow_form_text_label_total_debt')}>
        {totalDebt}
      </TextBox>
      {selectedPool && (
        <TextBox label={t('borrow_form_text_label_due_date')}>
          {dayjs()
            .add(selectedPool.term, 'day')
            .format('YYYY-MM-DD HH:mm')}
        </TextBox>
      )}
      <Button type="primary" block onClick={submit} disabled={loading}>
        {buttonText}
      </Button>
    </Form>
  );
};

export default withTranslation()(BorrowForm);
