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
  useLoadingType,
  LoadingType,
} from '../stores';
import Form from 'antd/lib/form';
import FormInput from '../components/FormInput';
import Button from 'antd/lib/button';
import Select from 'antd/lib/select';
import { convertWeiToDecimal, convertDecimalToWei } from '../utils/BigNumber';
import { useDepsUpdated, useComponentMounted } from '../utils/useEffectAsync';
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
import { BannerType } from '../components/Banner';
import { getTimezone } from '../utils/formatSolidityTime';
import sleep from '../utils/sleep';
import { parseQuery } from '../utils/parseQuery';

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
  const [borrowAmount, setBorrowAmount] = useState('');
  const [collateralToken, setCollateralToken] = useState<IToken>(
    loanPairs.filter(
      pair => pair.loanToken.tokenAddress === loanToken!.tokenAddress,
    )[0].collateralToken,
  );

  const selectedBalance = useMemo(() => {
    if (collateralToken) {
      return tokenBalance.find(
        b => b.tokenAddress === collateralToken.tokenAddress,
      );
    }
  }, [tokenBalance, collateralToken]);

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

  const [collateralRatio, setCollateralRatio] = useState<any>(
    Number.parseFloat(
      convertWeiToDecimal(
        selectedLoanPair && selectedLoanPair.minCollateralCoverageRatio,
      ),
    ) * 150,
  );

  const [illegalCollateralAmount, setIllegalCollateralAmount] = useState(false);
  const [collateralAmount, setCollateralAmountValue] = useState<
    string | number
  >();

  const setCollateralAmount = (value: string | number) => {
    if (selectedBalance) {
      setIllegalCollateralAmount(
        Number.parseFloat(`${value}`) >
          Number.parseFloat(convertWeiToDecimal(selectedBalance.balance)),
      );
    }

    setCollateralAmountValue(value);
  };

  const loadingType = useLoadingType();

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

  const totalDebt = useMemo(() => {
    if (selectedLoanPair && selectedPool) {
      const remainingDebt = calcEstimateRepayAmount(
        Number.parseFloat(borrowAmount),
        selectedPool.term,
        selectedPool.loanInterestRate || 0,
      );

      return Number.isNaN(remainingDebt)
        ? '0.0000'
        : convertWeiToDecimal(convertDecimalToWei(remainingDebt));
    }
  }, [selectedLoanPair, borrowAmount, selectedPool]);

  const [illegalBorrowAmount, setIllegalBorrowAmount] = useState(true);
  const [isNegativeBorrowAmount, setNegativeBorrowAmount] = useState(false);
  const [isOverAvailableAmount, setOverAvailableAmount] = useState(false);

  // Callbacks
  const onBorrowAmountChange = useCallback(
    (value: string) => {
      const isNan = /^(\d+\.?\d*|\.\d+)$/.test(value) === false;
      const tokenAmount = Number.parseFloat(value);

      if (
        isNan ||
        tokenAmount < 0 ||
        tokenAmount > selectedPool!.availableAmount ||
        value === '0'
      ) {
        setIllegalBorrowAmount(true);
        setNegativeBorrowAmount(tokenAmount < 0);
        setOverAvailableAmount(tokenAmount > selectedPool!.availableAmount);
      } else {
        setIllegalBorrowAmount(false);
      }

      setBorrowAmount(value);

      if (collateralToken && loanToken) {
        setCollateralAmount(
          calcCollateralAmount(
            collateralRatio,
            value,
            collateralToken.price,
            loanToken.price,
          ),
        );
      }
    },
    [
      setBorrowAmount,
      collateralToken,
      collateralRatio,
      loanToken,
      totalDebt,
      selectedPool,
    ],
  );

  const onBorrowAmountMaxButtonClick = useCallback(() => {
    if (selectedPool) {
      setBorrowAmount(`${selectedPool.availableAmount}`);
      setIllegalBorrowAmount(false);
      setNegativeBorrowAmount(false);
      setOverAvailableAmount(false);

      if (collateralToken && loanToken) {
        setCollateralAmount(
          calcCollateralAmount(
            collateralRatio,
            selectedPool.availableAmount.toString(),
            collateralToken.price,
            loanToken.price,
          ),
        );
      }
    }
  }, [selectedPool, collateralToken, loanToken]);

  const submit = useCallback(async () => {
    if (!loanToken || !collateralToken || !selectedPool) {
      return;
    }
    dispatch(ViewActions.setLoadingType(LoadingType.Borrow));
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
          convertDecimalToWei(borrowAmount, loanToken.decimals),
          convertDecimalToWei(collateralAmount!, collateralToken.decimals),
          selectedPool.term,
          distributorAddress,
        );

        while (true) {
          try {
            await loanService.getLoanRecordById(recordId);
            break;
          } catch (error) {
            await sleep(2500);
          }
        }

        dispatch(ViewActions.setBanner(t('common_borrow_succeed')));

        history.push(`/account/borrow/${recordId}`);
      }
    } catch (e) {
      dispatch(
        ViewActions.setBanner(
          t('common_borrow_fail_title'),
          BannerType.Warning,
          e.message,
        ),
      );
    }
    dispatch(ViewActions.setLoadingType(LoadingType.None));
  }, [
    loanToken,
    collateralToken,
    selectedPool,
    accountAddress,
    borrowAmount,
    collateralAmount,
    distributorAddress,
  ]);

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
        )!,
      ),
    [availableCollateralTokens],
  );

  const onCollateralAmountChange = useCallback(
    (value: string) => {
      setCollateralAmount(Number.parseFloat(value) || '');
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
      setCollateralRatio(value);
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
      return t(`common_loading_${loadingType}`);
    }
    if (
      collateralToken &&
      collateralToken.allowance &&
      collateralToken.allowance.toString() === '0'
    ) {
      return t('borrow_form_button_approve');
    }
    return t('borrow_form_button_borrow');
  }, [loading, collateralToken, loadingType]);

  const illegalRatio = useMemo(() => {
    return (
      collateralRatio <
      Number.parseFloat(
        convertWeiToDecimal(
          selectedLoanPair && selectedLoanPair.minCollateralCoverageRatio,
        ),
      ) *
        100
    );
  }, [collateralRatio, selectedLoanPair]);

  useDepsUpdated(async () => {
    const queryParams = parseQuery(location.search);
    onBorrowAmountChange(queryParams.amount || '');
  }, []);

  return (
    <Form>
      {loanToken && selectedPool && (
        <div>
          <FormInput
            label={t('borrow_form_input_label_borrow_amount')}
            type="text"
            suffix={loanToken.tokenSymbol}
            value={borrowAmount}
            onChange={onBorrowAmountChange}
            placeholder="0.00"
            actionButtons={[
              <Button key="max_btn" onClick={onBorrowAmountMaxButtonClick}>
                {t('borrow_form_input_button_max')}
              </Button>,
            ]}
          />

          {illegalBorrowAmount && borrowAmount !== '0' && borrowAmount ? (
            <div className="notice">
              {t(
                isNegativeBorrowAmount
                  ? 'common_deposit_fund_negative'
                  : isOverAvailableAmount
                  ? 'common_borrow_fund_not_enough'
                  : 'common_deposit_fund_illegal',
              )}
            </div>
          ) : (
            undefined
          )}
        </div>
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
        <div>
          <FormInput
            label={t('borrow_form_input_label_collateral_ratio')}
            type="text"
            value={collateralRatio}
            suffix="%"
            onChange={onCollateralRatioChange}
            actionButtons={[
              <Button
                className="collateral_ratio_minus"
                key="collateral_ratio_minus"
                onClick={modifyCollateralRatio(-10)}
                disabled={illegalRatio}
              >
                -10%
              </Button>,
              <Button
                key="collateral_ratio_plus"
                className="collateral_ratio_plus"
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

          {illegalRatio ? (
            <div className="notice">{t('common_illegal_collateral_ratio')}</div>
          ) : (
            undefined
          )}
        </div>
      )}
      {collateralToken && selectedBalance && (
        <FormInput
          label={t('borrow_form_input_label_collateral_amount')}
          type="number"
          className="collateral-amount-input"
          value={collateralAmount || ''}
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

      {illegalCollateralAmount ? (
        <div className="notice">{t('common_insufficient_balance')}</div>
      ) : (
        undefined
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
        <TextBox
          label={`${t('borrow_form_text_label_due_date')} (${getTimezone()})`}
        >
          {dayjs
            .utc()
            .local()
            .add(selectedPool.term, 'day')
            .format('YYYY-MM-DD HH:mm')}
        </TextBox>
      )}
      <div className="notice">{t('borrow_form_notice_after_due_date')}</div>
      <Button
        type="primary"
        block
        onClick={submit}
        loading={loadingType === LoadingType.Borrow}
        disabled={
          loading ||
          illegalRatio ||
          illegalBorrowAmount ||
          illegalCollateralAmount
        }
      >
        {buttonText}
      </Button>
    </Form>
  );
};

export default withTranslation()(withRouter(BorrowForm));
