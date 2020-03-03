import React, { useMemo } from 'react';
import { Row, Col } from 'antd/lib/grid';
import TextBox from '../components/TextBox';
import { withTranslation, WithTranslation } from 'react-i18next';
import {
  usePools,
  useTokenBalance,
  useLoanPairs,
  useDefaultAccount,
  useDistributorAddress,
  IState,
  useLoading,
  useLoanInterestRates,
  useDepositTokens,
  PoolActions,
  CommonActions,
  LoanActions,
  useInterestModelParameters,
} from '../stores';
import { RouteComponentProps } from 'react-router';
import { parseQuery } from '../utils/parseQuery';
import BorrowForm from '../containers/BorrowForm';
import { useSelector, useDispatch } from 'react-redux';
import { composePools } from '../utils/composePools';
import { useDepsUpdated } from '../utils/useEffectAsync';
import { getService } from '../services';
import { getLoanInterestRates } from '../utils/interestModel';

interface IProps
  extends WithTranslation,
    RouteComponentProps<{ poolId: string }> {}

const BorrowFormPage = (props: IProps) => {
  const {
    t,
    match: {
      params: { poolId },
    },
    location,
  } = props;

  const queryParams = parseQuery(location.search);

  const dispatch = useDispatch();

  // Selectors
  const accountAddress = useDefaultAccount();

  const distributorAddress = useDistributorAddress();

  const loading = useLoading();

  const pools = usePools();

  const tokens = useDepositTokens();

  const interestRates = useLoanInterestRates();

  const interestModelParameters = useInterestModelParameters();

  const protocolContractAddress = useSelector<IState, string>(
    state => state.common.protocolContractAddress,
  );

  const selectedPools = useMemo(() => pools[queryParams.tokenAddress], [
    queryParams.tokenAddress,
    pools,
  ]);

  const computedPools = useMemo(
    () => composePools(selectedPools, interestRates),
    [selectedPools, interestRates],
  );

  const selectedPool = useMemo(() => {
    if (poolId && computedPools) {
      return computedPools.find(p => p.poolId === poolId);
    }
  }, [computedPools, poolId]);

  const selectedToken = useMemo(
    () => tokens.find(token => token.tokenAddress === queryParams.tokenAddress),
    [tokens, queryParams.tokenAddress],
  );

  const tokenBalance = useTokenBalance();

  const loanPairs = useLoanPairs();

  const loanToken = useMemo(() => {
    if (queryParams.tokenAddress) {
      return loanPairs
        .map(pair => pair.loanToken)
        .find(token => token.tokenAddress === queryParams.tokenAddress);
    }
  }, [loanPairs, queryParams.tokenAddress]);

  // Initialize
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

  useDepsUpdated(async () => {
    if (
      selectedPools &&
      selectedPools.length > 0 &&
      selectedToken &&
      interestModelParameters
    ) {
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

  return (
    <div className="borrow-form-page">
      <Row>
        <Col span={12}>
          <TextBox label={t('borrow_form_label_term')}>
            {selectedPool &&
              t('borrow_form_text_term', { term: selectedPool.term })}
          </TextBox>
        </Col>
        <Col span={12}>
          <TextBox label={t('borrow_form_text_apr')}>
            {selectedPool
              ? (selectedPool.loanInterestRate * 100).toFixed(2)
              : '0.00'}
            %
          </TextBox>
        </Col>
      </Row>
      {selectedPool && (
        <BorrowForm
          protocolContractAddress={protocolContractAddress}
          selectedPool={selectedPool}
          loanToken={loanToken}
          accountAddress={accountAddress}
          loanPairs={loanPairs}
          tokenBalance={tokenBalance}
          distributorAddress={distributorAddress}
          loading={loading}
        />
      )}
    </div>
  );
};

export default withTranslation()(BorrowFormPage);
