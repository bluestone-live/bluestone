import React, { useMemo } from 'react';
import { Row, Col } from 'antd/lib/grid';
import TextBox from '../components/TextBox';
import { withTranslation, WithTranslation } from 'react-i18next';
import {
  useDepositTokens,
  usePools,
  useTokenBalance,
  useLoanPairs,
  useDefaultAccount,
} from '../stores';
import { RouteComponentProps } from 'react-router';
import { parseQuery } from '../utils/parseQuery';
import BorrowForm from '../containers/BorrowForm';

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
  const tokens = useDepositTokens();

  const accountAddress = useDefaultAccount();

  const loanToken = useMemo(() => {
    if (queryParams.tokenAddress) {
      return tokens.find(
        token => token.tokenAddress === queryParams.tokenAddress,
      );
    }
  }, [tokens, queryParams.tokenAddress]);

  const allPools = usePools();

  const selectedPool = useMemo(() => {
    if (
      poolId &&
      queryParams.tokenAddress &&
      allPools[queryParams.tokenAddress]
    ) {
      return allPools[queryParams.tokenAddress].find(
        pool => pool.poolId === poolId,
      );
    }
  }, [allPools, poolId, queryParams.tokenAddress]);

  const tokenBalance = useTokenBalance();

  const loanPairs = useLoanPairs();

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
            {selectedPool ? selectedPool.APR : '0.00'}%
          </TextBox>
        </Col>
      </Row>
      <BorrowForm
        selectedPool={selectedPool}
        loanToken={loanToken}
        accountAddress={accountAddress}
        loanPairs={loanPairs}
        tokenBalance={tokenBalance}
      />
    </div>
  );
};

export default withTranslation()(BorrowFormPage);
