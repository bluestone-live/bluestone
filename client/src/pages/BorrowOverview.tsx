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
} from '../stores';
import { useDepsUpdated } from '../utils/useEffectAsync';
import { getService } from '../services';
import TokenTab from '../components/TokenTab';
import BorrowPoolChart from '../containers/BorrowPoolChart';
import Button from 'antd/lib/button';
import { withRouter, RouteComponentProps } from 'react-router';
import BorrowPoolCard from '../containers/BorrowPoolCard';
import { composePools } from '../utils/composePools';
import { getLoanInterestRates } from '../utils/interestModel';
import { uniqueBy } from '../utils/uniqueBy';

interface IProps extends WithTranslation, RouteComponentProps {}

const BorrowOverview = (props: IProps) => {
  const { t, history } = props;

  const dispatch = useDispatch();

  // Selectors
  const loanPairs = useLoanPairs();
  const tokens = useMemo(
    () => uniqueBy(loanPairs.map(pair => pair.loanToken), 'tokenAddress'),
    [loanPairs],
  );
  const allPools = usePools();
  const interestRates = useLoanInterestRates();
  const interestModelParameters = useInterestModelParameters();

  // States
  const [selectedToken, setSelectedToken] = useState<IToken>();
  const [selectedTerm, setSelectedTerm] = useState<number>(1);

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
    (token: IToken) => setSelectedToken(token),
    [tokens],
  );
  const onTermChange = useCallback((term: number) => setSelectedTerm(term), [
    setSelectedTerm,
  ]);

  // Computed
  const selectedPools = useMemo(() => {
    if (allPools && selectedToken) {
      return allPools[selectedToken.tokenAddress] || [];
    }
    return [];
  }, [allPools, selectedToken]);

  useDepsUpdated(async () => {
    if (tokens.length > 0) {
      setSelectedToken(tokens[0]);
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

  const computedPools = useMemo(
    () => composePools(selectedPools, interestRates),
    [selectedPools, interestRates],
  );

  const selectedPool = useMemo(
    () => computedPools.find(pool => pool.term === selectedTerm),
    [selectedTerm, computedPools],
  );

  const onNextButtonClick = useCallback(() => {
    if (selectedToken && selectedPool) {
      history.push(
        `/borrow/${selectedPool.poolId}?tokenAddress=${selectedToken.tokenAddress}`,
      );
    }
  }, [selectedToken, selectedPool]);

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
          maxBorrowTerm={90}
          selectedTerm={selectedTerm}
          onTermChange={onTermChange}
        />
        {selectedPool && <BorrowPoolCard pool={selectedPool} />}
        <Button type="primary" block size="large" onClick={onNextButtonClick}>
          {t('borrow_overview_button_next')}
        </Button>
      </div>
    </div>
  );
};

export default withTranslation()(withRouter(BorrowOverview));
