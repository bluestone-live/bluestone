import React, { useState, useCallback, useMemo } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  IBalance,
  ILoanPair,
  IToken,
  PoolActions,
  AccountActions,
  CommonActions,
  ETHIdentificationAddress,
  ViewActions,
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
import {
  calcCollateralRatio,
  calcCollateralAmount,
} from '../utils/calcCollateralRatio';
import { RouteComponentProps, withRouter } from 'react-router';

interface IProps extends WithTranslation, RouteComponentProps {
  protocolContractAddress: string;
  accountAddress: string;
  loanToken?: IToken;
  loanPairs: ILoanPair[];
  tokenBalance: IBalance[];
  selectedPool?: {
    poolId: string;
    term: number;
    availableAmount: number;
    loanInterestRate: number;
  };
  distributorAddress: string;
  loading: boolean;
}

const BorrowForm = (props: IProps) => {
  const {
    accountAddress,
    protocolContractAddress,
    loanToken,
    loanPairs,
    tokenBalance,
    selectedPool,
    loading,
    distributorAddress,
    history,
    t,
  } = props;
  const dispatch = useDispatch();

  // States
  const [borrowAmount, setBorrowAmount] = useState();
  const [collateralToken, setCollateralToken] = useState<IToken>();
  const [collateralRatio, setCollateralRatio] = useState();
  const [collateralAmount, setCollateralAmount] = useState();

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
          collateralToken.tokenAddress === ETHIdentificationAddress
            ? await accountService.getETHBalance(accountAddress)
            : await accountService.getTokenBalance(
                accountAddress,
                collateralToken,
              ),
        ),
      );
    }
  }, [collateralToken, accountAddress]);

  // Callbacks
  const onBorrowAmountChange = useCallback(
    (value: string) => setBorrowAmount(Number.parseFloat(value)),
    [setBorrowAmount],
  );

  const onBorrowAmountMaxButtonClick = useCallback(() => {
    if (selectedPool) {
      setBorrowAmount(
        Number.parseFloat(selectedPool.availableAmount.toString()),
      );
    }
  }, [selectedPool]);

  const submit = useCallback(async () => {
    if (!loanToken || !collateralToken || !selectedPool) {
      return;
    }
    dispatch(ViewActions.setLoading(true));
    try {
      const { loanService, commonService } = await getService();
      if (
        collateralToken.allowance &&
        collateralToken.allowance.toString() === '0'
      ) {
        await commonService.approveFullAllowance(
          accountAddress,
          collateralToken,
          protocolContractAddress,
        );

        dispatch(
          CommonActions.setAllowance(
            collateralToken.tokenAddress,
            await commonService.getTokenAllowance(
              collateralToken,
              accountAddress,
              protocolContractAddress,
            ),
          ),
        );
      } else {
        const recordId = await loanService.loan(
          accountAddress,
          loanToken.tokenAddress,
          collateralToken.tokenAddress,
          convertDecimalToWei(borrowAmount),
          convertDecimalToWei(collateralAmount),
          selectedPool.term,
          distributorAddress,
        );

        history.push(`/account/borrow/${recordId}`);
      }
      // Ignore the error
      // tslint:disable-next-line:no-empty
    } catch (e) {}
    dispatch(ViewActions.setLoading(false));
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
      const remainingDebt = calcEstimateRepayAmount(
        borrowAmount,
        selectedPool.term,
        selectedPool.loanInterestRate || 0,
      );

      return Number.isNaN(remainingDebt) ? '0.0000' : remainingDebt.toFixed(4);
    }
  }, [selectedLoanPair, borrowAmount, selectedPool]);

  const onCollateralAmountChange = useCallback(
    (value: string) => {
      setCollateralAmount(Number.parseFloat(value));
      if (collateralToken && loanToken) {
        setCollateralRatio(
          calcCollateralRatio(
            value,
            totalDebt || '0',
            collateralToken.price,
            loanToken.price,
          ),
        );
      }
    },
    [collateralToken, loanToken, totalDebt],
  );

  const onCollateralRatioChange = useCallback(
    (value: string) => {
      setCollateralRatio(Number.parseFloat(value));
      if (collateralToken && loanToken) {
        setCollateralAmount(
          calcCollateralAmount(
            value,
            totalDebt || '0',
            collateralToken.price,
            loanToken.price,
          ),
        );
      }
    },
    [collateralToken, loanToken, totalDebt],
  );

  const modifyCollateralRatio = useCallback(
    (num: number) => () => {
      setCollateralRatio(Number.parseFloat(collateralRatio) + num);
      if (collateralToken && loanToken) {
        setCollateralAmount(
          calcCollateralAmount(
            collateralRatio + num,
            totalDebt || '0',
            collateralToken.price,
            loanToken.price,
          ),
        );
      }
    },
    [collateralRatio, collateralToken, loanToken, totalDebt],
  );

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
      {loanToken && selectedPool && (
        <FormInput
          label={t('borrow_form_input_label_borrow_amount')}
          type="number"
          suffix={loanToken.tokenSymbol}
          value={borrowAmount}
          onChange={onBorrowAmountChange}
          extra={t('borrow_form_input_extra_available_amount', {
            balance: selectedPool
              ? selectedPool.availableAmount.toString()
              : '0',
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
          type="number"
          value={collateralRatio}
          suffix="%"
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
      {collateralToken && selectedBalance && (
        <FormInput
          label={t('borrow_form_input_label_collateral_amount')}
          type="number"
          className="collateral-amount-input"
          value={collateralAmount}
          onChange={onCollateralAmountChange}
          suffix={collateralToken.tokenSymbol}
          placeholder={convertWeiToDecimal(selectedBalance.balance)}
          extra={
            <span className="bold">
              {t('borrow_form_input_extra_price', {
                symbol: collateralToken.tokenSymbol,
                price: convertWeiToDecimal(collateralToken.price, 2),
              })}
            </span>
          }
        />
      )}
      {loanToken && (
        <TextBox label={t('borrow_form_text_label_total_debt')}>
          <span
            className={
              Number.parseFloat(totalDebt || '0') === 0 ? 'grey' : 'primary'
            }
          >
            {totalDebt}
          </span>{' '}
          {loanToken.tokenSymbol}
        </TextBox>
      )}
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

export default withTranslation()(withRouter(BorrowForm));
