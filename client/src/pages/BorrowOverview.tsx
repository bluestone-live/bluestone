import React, { useState, useCallback, useMemo } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useDepositTokens, usePools, PoolActions, IToken } from '../stores';
import { useDepsUpdated } from '../utils/useEffectAsync';
import { getService } from '../services';
import TokenTab from '../components/TokenTab';
import BorrowPoolChart from '../containers/BorrowPoolChart';
import Button from 'antd/lib/button';
import { withRouter, RouteComponentProps } from 'react-router';
import BorrowPoolCard from '../containers/BorrowPoolCard';
import { convertWeiToDecimal } from '../utils/BigNumber';

interface IProps extends WithTranslation, RouteComponentProps {}

const BorrowOverview = (props: IProps) => {
  const { t, history } = props;

  const dispatch = useDispatch();

  // Selectors
  const tokens = useDepositTokens();
  const allPools = usePools();

  // States
  const [selectedToken, setSelectedToken] = useState<IToken>();
  const [selectedTerm, setSelectedTerm] = useState<number>(1);

  // Init
  useDepsUpdated(async () => {
    if (selectedToken) {
      const { poolService } = await getService();

      dispatch(
        PoolActions.replacePools(
          selectedToken.tokenAddress,
          await poolService.getPoolsByToken(selectedToken.tokenAddress),
        ),
      );
    }
  }, [selectedToken]);

  useDepsUpdated(async () => {
    if (tokens.length > 0) {
      setSelectedToken(tokens[0]);
    }
  }, [tokens]);

  // Callbacks
  const onTokenSelect = useCallback(
    (token: IToken) => setSelectedToken(token),
    [tokens],
  );
  const onTermChange = useCallback((term: number) => setSelectedTerm(term), [
    setSelectedTerm,
  ]);
  const onNextButtonClick = useCallback(() => {
    if (selectedToken && selectedPool) {
      history.push(
        `/borrow/${selectedPool.poolId}?tokenAddress=${selectedToken.tokenAddress}`,
      );
    }
  }, [selectedToken, selectedTerm]);

  // Computed
  const selectedPools = useMemo(() => {
    if (allPools && selectedToken) {
      return allPools[selectedToken.tokenAddress] || [];
    }
    return [];
  }, [allPools, selectedToken]);

  const computedPools = useMemo(
    () =>
      selectedPools.map((pool, i, array) => ({
        poolId: pool.poolId,
        term: pool.term,
        availableAmount:
          parseFloat(convertWeiToDecimal(pool.availableAmount)) +
          array
            .slice(i + 1, array.length)
            .reduce(
              (sum, p) =>
                sum + parseFloat(convertWeiToDecimal(p.availableAmount)),
              0,
            ),
        APR: parseFloat(convertWeiToDecimal(pool.APR)),
      })),
    [selectedPools],
  );

  const selectedPool = useMemo(
    () => computedPools.find(pool => pool.term === selectedTerm),
    [selectedTerm, computedPools],
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
