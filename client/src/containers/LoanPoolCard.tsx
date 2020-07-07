import React, { useMemo } from 'react';
import Card from 'antd/lib/card';
import { withTranslation, WithTranslation } from 'react-i18next';
import { IToken } from '../stores/CommonStore';

interface IProps extends WithTranslation {
  pool: {
    term: number;
    loanInterestRate: number;
    availableAmount: number;
  };
  token?: IToken;
}

const LoanPoolCard = (props: IProps) => {
  const { pool, t, token } = props;

  const title = useMemo(
    () => (
      <div className="borrow-pool-card__title">
        <div className="term">
          {t('borrow_pool_card_term', { term: pool.term })}
        </div>
      </div>
    ),
    [pool.term],
  );

  return (
    <Card className="borrow-pool-card" title={title} bordered={false}>
      <p>
        {t('borrow_pool_card_text_apr')}:{' '}
        {(pool.loanInterestRate * 100).toFixed(2)}% <br />
        {t('borrow_pool_card_text_available_amount')}:
        {` ${pool.availableAmount} ${token && token.tokenSymbol}`}
      </p>
    </Card>
  );
};

export default withTranslation()(LoanPoolCard);
