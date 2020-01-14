import React, {
  useCallback,
  useState,
  Fragment,
  ChangeEvent,
  useMemo,
} from 'react';
import TokenTab from '../components/TokenTab';
import {
  useDepositTokens,
  IToken,
  ViewActions,
  IDepositRecord,
  RecordType,
} from '../stores';
import Form from 'antd/lib/form';
import FormInput from '../components/FormInput';
import TextBox from '../components/TextBox';
import Button from 'antd/lib/button';
import { useDispatch } from 'react-redux';
import Dropdown from 'antd/lib/dropdown';
import Icon from 'antd/lib/icon';
import Menu, { ClickParam } from 'antd/lib/menu';
import RecordStatus from '../components/RecordStatus';
import dayjs from 'dayjs';
import { convertDecimalToWei } from '../utils/BigNumber';
import CollateralCoverageRatio from '../components/CollateralCoverageRatio';

const Demo = () => {
  const dispatch = useDispatch();

  dispatch(ViewActions.setBanner('Add Collateral Succeed'));

  const tokens = useDepositTokens();

  const [selectedToken, setSelectedToken] = useState();

  const [borrowAmount, setBorrowAmount] = useState('100');
  const [collateralRatio, setCollateralRatio] = useState(150);

  const sortingParams = useMemo(
    () => ['term', 'ARP', 'utilization', 'totalDeposit'],
    [],
  );

  const [sortBy, setSortBy] = useState(sortingParams[0]);

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

  const onDropDownChange = useCallback(
    (param: ClickParam) => {
      setSortBy(param.key);
    },
    [sortingParams],
  );

  const DropDownMenu = useMemo(
    () => (
      <Menu onClick={onDropDownChange}>
        {sortingParams.map(menu => (
          <Menu.Item key={menu}>{menu}</Menu.Item>
        ))}
      </Menu>
    ),
    [onDropDownChange, sortingParams],
  );

  const record: IDepositRecord = {
    recordId: '1',
    tokenAddress: '0x0000000000000000000000000000001',
    depositTerm: {
      text: '30',
      value: 30,
    },
    depositAmount: convertDecimalToWei(0),
    createdAt: dayjs(),
    maturedPoolID: '18700',
    recordType: RecordType.Deposit,
    isMatured: true,
  };

  return (
    <Fragment>
      <TokenTab
        tokens={tokens}
        onTokenSelect={onTokenSelect}
        selectedToken={selectedToken}
      />
      <hr />
      <Dropdown
        overlay={DropDownMenu}
        trigger={['click']}
        placement="bottomCenter"
      >
        <Button>
          {sortBy} <Icon type="caret-down" />
        </Button>
      </Dropdown>
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
      <hr />
      <RecordStatus record={record} />
      <CollateralCoverageRatio
        currentCollateralRatio={140}
        minCollateralRatio={150}
      />
    </Fragment>
  );
};

export default Demo;
