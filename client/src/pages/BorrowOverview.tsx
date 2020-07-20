import React, { useState, useCallback, useMemo } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import {
  usePools,
  PoolActions,
  IToken,
  LoanActions,
  useLoanInterestRates,
  CommonActions,
  useInterestModelParameters,
  useLoanPairs,
  useDepositTokens,
  useDepositTerms,
} from '../stores';
import { useDepsUpdated } from '../utils/useEffectAsync';
import { getService } from '../services';
import TokenTab from '../components/TokenTab';
import BorrowPoolChart from '../containers/BorrowPoolChart';
import Button from 'antd/lib/button';
import { withRouter, RouteComponentProps } from 'react-router';
import { composePools } from '../utils/composePools';
import { getLoanInterestRates } from '../utils/interestModel';
import { uniqueBy } from '../utils/uniqueBy';
import { parseQuery } from '../utils/parseQuery';
import FormInput from '../components/FormInput';

interface IProps extends WithTranslation, RouteComponentProps {}

const BorrowOverview = (props: IProps) => {
  const { t, history, location } = props;

  const queryParams = parseQuery(location.search);

  const dispatch = useDispatch();

  const depositTerms = useDepositTerms();
  const maxTerm = depositTerms.sort((a, b) => b.value - a.value)[0];

  // Selectors
  const loanPairs = useLoanPairs();
  const tokens = useMemo(
    () => uniqueBy(loanPairs.map(pair => pair.loanToken), 'tokenAddress'),
    [loanPairs],
  );
  const allPools = usePools();
  const interestRates = useLoanInterestRates();
  const interestModelParameters = useInterestModelParameters();

  const depositTokens = useDepositTokens();
  // States
  const [selectedToken, setSelectedToken] = useState<IToken | undefined>(
    () =>
      depositTokens.find(
        token => token.tokenAddress === queryParams.tokenAddress,
      ) || depositTokens[0],
  );
  const [selectedTerm, setSelectedTerm] = useState('7');
  const [borrowAmount, setBorrowAmount] = useState('');

  // Init
  useDepsUpdated(async () => {
    if (selectedToken) {
      const { poolService, commonService } = await getService();

      dispatch(
        PoolActions.replacePools(
          selectedToken.tokenAddress,
          await poolService.getPoolsByToken(selectedToken.tokenAddress),
        ),
      );
      dispatch(
        CommonActions.setInterestModelParameters(
          await commonService.getInterestModelParameters(
            selectedToken.tokenAddress,
          ),
        ),
      );
    }
  }, [selectedToken]);

  // Callbacks
  const onTokenSelect = useCallback(
    (token: IToken) => {
      history.replace(
        `${location.pathname}?tokenAddress=${token.tokenAddress}`,
      );
      setSelectedToken(token);
    },
    [tokens],
  );

  const onTermChange = useCallback(
    (term: number) => {
      setSelectedTerm(`${term}`);
    },
    [setSelectedTerm],
  );

  const onInputTermChange = useCallback(
    (term: string) => {
      setSelectedTerm(term);
    },
    [setSelectedTerm, selectedTerm],
  );

  const modifyTermChange = useCallback(
    (num: number) => () => {
      setSelectedTerm(`${Number.parseInt(selectedTerm, 10) + num}`);
    },
    [selectedTerm],
  );

  // Computed
  const selectedPools = useMemo(() => {
    if (allPools && selectedToken) {
      return allPools[selectedToken.tokenAddress] || [];
    }
    return [];
  }, [allPools, selectedToken]);

  const computedPools = useMemo(
    () => composePools(selectedPools, interestRates, tokens),
    [selectedPools, interestRates],
  );

  const selectedPool = useMemo(
    () =>
      computedPools.find(
        pool => pool.term === Number.parseInt(selectedTerm, 10),
      ),
    [selectedTerm, computedPools],
  );

  const onBorrowAmountChange = useCallback((text: string) => {
    setBorrowAmount(text);
  }, []);

  const onBorrowAmountMaxButtonClick = useCallback(() => {
    if (!selectedPool) {
      return;
    }
    setBorrowAmount(`${selectedPool.availableAmount}`);
  }, [selectedPool, selectedTerm]);

  useDepsUpdated(async () => {
    if (tokens.length > 0) {
      setSelectedToken(
        depositTokens.find(
          token => token.tokenAddress === queryParams.tokenAddress,
        ) || depositTokens[0],
      );
    }
  }, [tokens]);

  useDepsUpdated(async () => {
    if (selectedPools.length > 0 && selectedToken && interestModelParameters) {
      dispatch(
        LoanActions.SetLoanInterestRate(
          getLoanInterestRates(
            interestModelParameters.loanInterestRateLowerBound,
            interestModelParameters.loanInterestRateUpperBound,
            '1',
            selectedPools.length.toString(),
          ).map((interestRate, index) => ({
            term: index + 1,
            interestRate,
          })),
        ),
      );
    }
  }, [selectedToken, selectedPools, interestModelParameters]);

  const onNextButtonClick = useCallback(() => {
    if (selectedToken && selectedPool) {
      history.push(
        `/borrow/${selectedPool.poolId}?tokenAddress=${selectedToken.tokenAddress}&amount=${borrowAmount}`,
      );
    }
  }, [selectedToken, selectedPool, selectedTerm, borrowAmount]);

  const selectedTermValue = Math.min(
    90,
    Math.max(1, Number.parseInt(selectedTerm, 10) || 1),
  );

  return (
    <div className="borrow-overview">
      <TokenTab
        tokens={tokens}
        onTokenSelect={onTokenSelect}
        selectedToken={selectedToken}
      />
      <div className="title chart-block full-width">
        <div>{t('borrow_overview_title_select_term')}</div>
        <BorrowPoolChart
          pools={computedPools}
          maxBorrowTerm={maxTerm.value}
          selectedTerm={selectedTermValue}
          onTermChange={onTermChange}
          symbol={selectedToken && selectedToken.tokenSymbol}
          t={t}
        />
        <div>
          <FormInput
            label={t('borrow_overview_input_term')}
            type="text"
            value={selectedTerm}
            suffix={t('common_day')}
            onChange={onInputTermChange}
            actionButtons={[
              <Button
                className="collateral_ratio_minus"
                key="collateral_ratio_minus"
                onClick={modifyTermChange(-1)}
                disabled={selectedTermValue <= 1}
              >
                -1 {t('common_day')}
              </Button>,
              <Button
                key="collateral_ratio_plus"
                className="collateral_ratio_plus"
                onClick={modifyTermChange(1)}
                disabled={selectedTermValue >= 90}
              >
                +1 {t('common_day')}
              </Button>,
            ]}
          />

          {selectedToken && (
            <FormInput
              label={t('borrow_form_input_label_borrow_amount')}
              type="text"
              suffix={selectedToken.tokenSymbol}
              value={borrowAmount}
              onChange={onBorrowAmountChange}
              placeholder="0.00"
              actionButtons={[
                <Button key="max_btn" onClick={onBorrowAmountMaxButtonClick}>
                  {t('borrow_form_input_button_max')}
                </Button>,
              ]}
            />
          )}
        </div>
        <Button
          type="primary"
          className="next-button"
          block
          size="large"
          onClick={onNextButtonClick}
          disabled={selectedPool && selectedPool.availableAmount <= 0}
        >
          {t('borrow_overview_button_next')}
        </Button>
      </div>
    </div>
  );
};

export default withTranslation()(withRouter(BorrowOverview));
