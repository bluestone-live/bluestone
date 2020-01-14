import React, { useMemo } from 'react';
import DepositForm from '../containers/DepositForm';
import { withRouter, RouteComponentProps } from 'react-router';
import { parseQuery } from '../utils/parseQuery';
import {
  useDepositTokens,
  usePools,
  useTokenBalance,
  useDefaultAccount,
  useDistributorConfig,
  AccountActions,
  PoolActions,
  IState,
} from '../stores';
import { useDepsUpdated } from '../utils/useEffectAsync';
import DepositPoolCard from '../components/DepositPoolCard';
import DepositPoolCardPlaceholder from '../placeholders/DepositPoolCardPlaceholder';
import { useDispatch, useSelector } from 'react-redux';
import { getService } from '../services';
import { WithTranslation, withTranslation } from 'react-i18next';

interface IProps
  extends WithTranslation,
    RouteComponentProps<{ poolId: string }> {}

const DepositFormPage = (props: IProps) => {
  const {
    location,
    history,
    match: { params },
    t,
  } = props;

  const queryParams = parseQuery(location.search);
  const dispatch = useDispatch();

  // Selectors
  const accountAddress = useDefaultAccount();
  const depositTokens = useDepositTokens();
  const pools = usePools();
  const tokenBalance = useTokenBalance();
  const { address: distributorAddress } = useDistributorConfig();
  const protocolAddress = useSelector<IState, string>(
    state => state.common.protocolContractAddress,
  );

  // Computed
  const selectedToken = useMemo(
    () =>
      depositTokens.find(
        token => token.tokenAddress === queryParams.tokenAddress,
      ),
    [depositTokens, queryParams.tokenAddress],
  );

  const selectedPool = useMemo(
    () =>
      pools[queryParams.tokenAddress]
        ? pools[queryParams.tokenAddress].find(p => p.poolId === params.poolId)
        : null,
    [pools, queryParams.tokenAddress],
  );

  const selectedTokenBalance =
    selectedToken &&
    tokenBalance.find(
      balance => balance.tokenAddress === selectedToken.tokenAddress,
    );

  // Initialize
  useDepsUpdated(async () => {
    const { accountService, poolService } = await getService();
    if (selectedToken && accountAddress) {
      dispatch(
        AccountActions.setTokenBalance(
          selectedToken.tokenAddress,
          await accountService.getTokenBalance(accountAddress, selectedToken),
        ),
      );
      dispatch(
        PoolActions.replacePools(
          selectedToken.tokenAddress,
          await poolService.getPoolsByToken(selectedToken.tokenAddress),
        ),
      );
    }
  }, [selectedToken, accountAddress]);

  useDepsUpdated(async () => {
    if (!queryParams.tokenAddress || !params.poolId) {
      const tokenAddress =
        queryParams.tokenAddress || depositTokens[0].tokenAddress;
      const poolId = params.poolId || pools[tokenAddress][0].poolId;

      history.replace(`/deposit/${poolId}?tokenAddress=${tokenAddress}`);
    }
  }, [queryParams.tokenAddress, params.poolId]);

  useDepsUpdated(async () => {
    if (selectedToken && !pools[selectedToken.tokenAddress]) {
      const { poolService } = await getService();

      dispatch(
        PoolActions.replacePools(
          selectedToken.tokenAddress,
          await poolService.getPoolsByToken(selectedToken.tokenAddress),
        ),
      );
    }
  }, [selectedToken]);

  return (
    <div className="deposit-form-page">
      <div className="secondary-title">
        {t('deposit_form_page_title_select_term')}
      </div>
      {queryParams.tokenAddress && params.poolId && selectedPool ? (
        <DepositPoolCard isMostBorrowed={false} pool={selectedPool} />
      ) : (
        <DepositPoolCardPlaceholder />
      )}
      {selectedPool && selectedToken && selectedTokenBalance && (
        <DepositForm
          distributorAddress={distributorAddress}
          accountAddress={accountAddress}
          tokenBalance={selectedTokenBalance}
          token={selectedToken}
          pool={selectedPool}
          protocolContractAddress={protocolAddress}
        />
      )}
    </div>
  );
};

export default withTranslation()(withRouter(DepositFormPage));
