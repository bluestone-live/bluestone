import React, { useMemo } from 'react';
import { Row, Col } from 'antd/lib/grid';
import TextBox from '../components/TextBox';
import { withTranslation, WithTranslation } from 'react-i18next';
import {
  usePools,
  useTokenBalance,
  useLoanPairs,
  useDefaultAccount,
  useDistributorConfig,
  useActionButtonLoading,
  useLoanInterestRates,
  IState,
} from '../stores';
import { RouteComponentProps } from 'react-router';
import { parseQuery } from '../utils/parseQuery';
import BorrowForm from '../containers/BorrowForm';
import { useSelector } from 'react-redux';

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

  // Selectors
  const accountAddress = useDefaultAccount();

  const { address: distributorAddress } = useDistributorConfig();

  const loading = useActionButtonLoading();

  const allPools = usePools();

  const interestRates = useLoanInterestRates();

  const protocolContractAddress = useSelector<IState, string>(
    state => state.common.protocolContractAddress,
  );

  const selectedPool = useMemo(() => {
    if (
      poolId &&
      queryParams.tokenAddress &&
      allPools[queryParams.tokenAddress]
    ) {
      const pool = allPools[queryParams.tokenAddress].find(
        p => p.poolId === poolId,
      );
      if (pool) {
        return {
          ...pool,
          loanInterestRate: (
            interestRates.find(r => r.term === pool.term) || {
              interestRate: '0',
            }
          ).interestRate,
        };
      }
    }
  }, [allPools, poolId, queryParams.tokenAddress]);

  const tokenBalance = useTokenBalance();

  const loanPairs = useLoanPairs();

  const loanToken = useMemo(() => {
    if (queryParams.tokenAddress) {
      return loanPairs
        .map(pair => pair.loanToken)
        .find(token => token.tokenAddress === queryParams.tokenAddress);
    }
  }, [loanPairs, queryParams.tokenAddress]);

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
            {selectedPool ? selectedPool.loanInterestRate : '0.00'}%
          </TextBox>
        </Col>
      </Row>
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
    </div>
  );
};

export default withTranslation()(BorrowFormPage);
