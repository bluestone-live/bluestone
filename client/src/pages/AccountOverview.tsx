import React, { useCallback, useState, useMemo } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { WithTranslation, withTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import {
  useDepositRecords,
  useLoanRecords,
  IRecord,
  useDefaultAccount,
  DepositActions,
  LoanActions,
  RecordType,
  IDepositRecord,
  ILoanRecord,
  useDepositTokens,
} from '../stores';
import RecordCard from '../containers/RecordCard';
import { useComponentMounted } from '../utils/useEffectAsync';
import { getService } from '../services';
import { parseQuery } from '../utils/parseQuery';
import Menu, { ClickParam } from 'antd/lib/menu';

interface IProps extends RouteComponentProps, WithTranslation {}

const AccountOverview = (props: IProps) => {
  const {
    history,
    t,
    location: { search },
  } = props;

  const { activeTab, fromUser } = parseQuery(search);

  const dispatch = useDispatch();

  // Selectors
  const accountAddress = useDefaultAccount();

  const depositRecords = useDepositRecords();

  const borrowRecords = useLoanRecords();

  const tokens = useDepositTokens();

  const tabKeys = ['active', 'closed', 'deposit', 'borrow'];

  // State
  const [selectedTab, setSelectedTab] = useState<string>(activeTab || 'active');

  // Initialize

  useComponentMounted(async () => {
    const { depositService, loanService } = await getService();

    const userDepositRecords = await depositService.getDepositRecordsByAccount(
      accountAddress,
    );

    const loanRecords = await loanService.getLoanRecordsByAccount(
      accountAddress,
    );

    dispatch(DepositActions.replaceDepositRecords(userDepositRecords));

    dispatch(LoanActions.replaceLoanRecords(loanRecords));

    if (
      userDepositRecords.filter(r => !r.isWithdrawn).length +
        loanRecords.filter(r => !r.isClosed).length ===
        0 &&
      fromUser !== '1'
    ) {
      history.push(`/deposit`);
    }
  });

  // Computed
  const records = useMemo(
    () =>
      (depositRecords as IRecord[])
        .concat(borrowRecords as IRecord[])
        .sort(
          (r1: IRecord, r2: IRecord) =>
            r1.createdAt.valueOf() - r2.createdAt.valueOf(),
        ),
    [depositRecords, borrowRecords],
  );

  const filteredRecords = useMemo(() => {
    switch (selectedTab) {
      case 'active':
        return records.filter(r => {
          if (r.recordType === RecordType.Deposit) {
            return !(r as IDepositRecord).isWithdrawn;
          } else {
            return !(r as ILoanRecord).isClosed;
          }
        });
      case 'closed':
        return records.filter(r => {
          if (r.recordType === RecordType.Deposit) {
            return (r as IDepositRecord).isWithdrawn;
          } else {
            return (r as ILoanRecord).isClosed;
          }
        });
      case 'deposit':
        return records.filter(r => r.recordType === RecordType.Deposit);
      case 'borrow':
        return records.filter(r => r.recordType === RecordType.Borrow);
      default:
        return records;
    }
  }, [records, selectedTab]);

  // Callbacks
  const onTabClick = useCallback((param: ClickParam) => {
    setSelectedTab(param.key);
    history.replace(
      window.location.pathname + `?activeTab=${param.key}&fromUser=1`,
    );
  }, []);

  const onClick = useCallback(
    (record: IRecord) => {
      history.push(`/account/${record.recordType}/${record.recordId}`);
    },
    [records],
  );

  return (
    <div className="account-overview">
      <Menu
        className="record-status-tab"
        mode="horizontal"
        onClick={onTabClick}
        selectedKeys={[selectedTab]}
      >
        {tabKeys.map((key, i) => (
          <Menu.Item
            key={key}
            className={i === 0 ? 'first' : undefined}
            style={{ width: '25%' }}
          >
            {t(`account_overview_tab_${key}`)}
          </Menu.Item>
        ))}
      </Menu>
      <div className="record-cards">
        {filteredRecords
          .sort((r1, r2) => r2.createdAt.valueOf() - r1.createdAt.valueOf())
          .map(record => (
            <RecordCard
              tokens={tokens}
              key={record.recordId}
              record={record}
              onClick={onClick}
            />
          ))}
      </div>
    </div>
  );
};

export default withTranslation()(withRouter(AccountOverview));
