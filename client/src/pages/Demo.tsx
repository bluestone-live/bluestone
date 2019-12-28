import React, { useCallback, useState, Fragment, ChangeEvent } from 'react';
import TokenTab from '../components/TokenTab';
import { useDepositTokens, IToken } from '../stores';
import Form from 'antd/lib/form';
import FormInput from '../components/FormInput';

const Demo = () => {
  const tokens = useDepositTokens();

  const [selectedToken, setSelectedToken] = useState();

  const [borrowAmount, setBorrowAmount] = useState('100');

  const onTokenSelect = useCallback(
    (token: IToken) => setSelectedToken(token),
    [tokens],
  );

  const onBorrowAmountChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setBorrowAmount(e.target.value),
    [setBorrowAmount],
  );

  return (
    <Fragment>
      <TokenTab
        tokens={tokens}
        onTokenSelect={onTokenSelect}
        selectedToken={selectedToken}
      />
      <hr />
      <Form>
        <FormInput
          label="Borrow Amount"
          size="large"
          type="number"
          suffix="DAI"
          defaultValue={borrowAmount}
          value={borrowAmount}
          onChange={onBorrowAmountChange}
          extra="Available Amount:300 DAI"
          tip={{
            title: 'Notice',
            content: (
              <div>
                150% is safe line for the collateral. If below 150%, this borrow
                will be balallala automatically. THIS REMINDER NEED TO UPDATE.
              </div>
            ),
          }}
        />
      </Form>
    </Fragment>
  );
};

export default Demo;
