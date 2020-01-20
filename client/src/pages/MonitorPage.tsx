import React, { useCallback, useMemo } from 'react';
import {
  useDepositTokens,
  IToken,
  usePools,
  PoolActions,
  IPool,
} from '../stores';
import TokenTab from '../components/TokenTab';
import { RouteComponentProps } from 'react-router';
import { parseQuery } from '../utils/parseQuery';
import { useDepsUpdated } from '../utils/useEffectAsync';
import MonitorPoolCard from '../containers/MonitorPoolCard';
import { getService } from '../services';
import { useDispatch } from 'react-redux';

const MonitorPage = (props: RouteComponentProps) => {
  const {
    location: { search, pathname },
    history,
  } = props;

  const dispatch = useDispatch();

  const tokens = useDepositTokens();
  const queryParams = parseQuery(search);
  const pools = usePools();

  const selectedToken = useMemo(
    () => tokens.find(tk => tk.tokenAddress === queryParams.tokenAddress),
    [tokens, queryParams.tokenAddress],
  );

  const setSelectedToken = useCallback((token?: IToken) => {
    if (token) {
      history.push({
        pathname,
        search: `?tokenAddress=${token.tokenAddress}`,
      });
    }
  }, []);

  const onTokenSelect = useCallback(
    (token: IToken) => setSelectedToken(token),
    [tokens],
  );

  const selectedPools = useMemo(() => {
    if (selectedToken) {
      return pools[selectedToken.tokenAddress];
    }
  }, [pools, selectedToken]);

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
    if (tokens.length > 0 && queryParams.tokenAddress) {
      setSelectedToken(
        tokens.find(token => token.tokenAddress === queryParams.tokenAddress),
      );
    }
  }, [tokens, queryParams.tokenAddress]);

  useDepsUpdated(async () => {
    if (tokens.length > 0 && !selectedToken) {
      setSelectedToken(tokens[0]);
    }
  }, [tokens]);

  const onPoolClick = useCallback(
    (pool: IPool) =>
      history.push(`/monitor/${pool.poolId}?tokenAddress=${pool.tokenAddress}`),
    [selectedPools],
  );

  return (
    <div className="monitor-page">
      <TokenTab
        tokens={tokens}
        onTokenSelect={onTokenSelect}
        selectedToken={selectedToken}
      />

      {selectedPools && (
        <div className="pool-cards">
          {selectedPools.map(pool => (
            <MonitorPoolCard
              key={pool.poolId + pool.tokenAddress}
              pool={pool}
              onClick={onPoolClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MonitorPage;
