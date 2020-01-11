import React, { useMemo } from 'react';
import Card from 'antd/lib/card';
import { withTranslation, WithTranslation } from 'react-i18next';

interface IProps extends WithTranslation {
  pool: {
    term: number;
    APR: number;
    availableAmount: number;
  };
}

const BorrowPoolCard = (props: IProps) => {
  const { pool, t } = props;

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
        {t('borrow_pool_card_text_apr')}: {pool.APR}% <br />
        {t('borrow_pool_card_text_available_amount')}: {pool.availableAmount}
      </p>
    </Card>
  );
};

export default withTranslation()(BorrowPoolCard);
