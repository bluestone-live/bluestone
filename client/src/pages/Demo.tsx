import React, { useCallback, useState, Fragment, ChangeEvent } from 'react';
import TokenTab from '../components/TokenTab';
import { useDepositTokens, IToken, ViewAction } from '../stores';
import Form from 'antd/lib/form';
import FormInput from '../components/FormInput';
import TextBox from '../components/TextBox';
import Button from 'antd/lib/button';
import { useDispatch } from 'react-redux';

const Demo = () => {
  const dispatch = useDispatch();

  dispatch(ViewAction.setBanner('Add Collateral Succeed'));

  const tokens = useDepositTokens();

  const [selectedToken, setSelectedToken] = useState();

  const [borrowAmount, setBorrowAmount] = useState('100');
  const [collateralRatio, setCollateralRatio] = useState(150);

  const onTokenSelect = useCallback(
    (token: IToken) => setSelectedToken(token),
    [tokens],
  );

  const onBorrowAmountChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setBorrowAmount(e.target.value),
    [setBorrowAmount],
  );

  const onBorrowAmountMaxButtonClick = useCallback(
    () => setBorrowAmount('300'),
    [],
  );

  const onCollateralRatioChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      setCollateralRatio(Number.parseFloat(e.target.value.replace('%', ''))),
    [setCollateralRatio],
  );

  const modifyCollateralRatio = useCallback(
    (num: number) => () => setCollateralRatio(collateralRatio + num),
    [collateralRatio],
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
          type="number"
          suffix="DAI"
          defaultValue={borrowAmount}
          value={borrowAmount}
          onChange={onBorrowAmountChange}
          extra="Available Amount:300 DAI"
          actionButtons={[
            <Button key="max_btn" onClick={onBorrowAmountMaxButtonClick}>
              MAX
            </Button>,
          ]}
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
        <TextBox label="Total Debt">0.0000 DAI</TextBox>
        <FormInput
          label="Collateral Ratio"
          type="text"
          defaultValue={`${collateralRatio}%`}
          value={`${collateralRatio}%`}
          onChange={onCollateralRatioChange}
          actionButtons={[
            <Button
              key="collateral_ratio_minus"
              onClick={modifyCollateralRatio(-10)}
            >
              -10%
            </Button>,
            <Button
              key="collateral_ratio_plus"
              onClick={modifyCollateralRatio(10)}
            >
              +10%
            </Button>,
          ]}
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
