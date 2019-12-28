import React, { useMemo, useState, useCallback } from 'react';
import { Icon } from 'antd';
import { WithTranslation, withTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router';
import TabBar, { TabType } from '../components/TabBar';
import DepositOverview from '../containers/DepositOverview';
import LoanOverview from '../containers/BorrowOverview';
import Account from '../containers/Account';

interface IProps extends WithTranslation, RouteComponentProps {}

const Overview = (props: IProps) => {
  const { t } = props;

  const [selectedTab, setSelectedTab] = useState(TabType.Deposit);

  const tabOptions = useMemo(
    () => [
      {
        title: t('layout_default_deposit'),
        type: TabType.Deposit,
        icon: <Icon type="up" />,
        content: <DepositOverview />,
      },
      {
        title: t('layout_default_borrow'),
        type: TabType.Borrow,
        icon: <Icon type="down" />,
        content: <LoanOverview />,
      },
      {
        title: t('layout_default_account'),
        type: TabType.Account,
        icon: <Icon type="ellipsis" />,
        content: <Account />,
      },
    ],
    [],
  );

  const onTabItemPress = useCallback(
    (type: TabType) => () => setSelectedTab(type),
    [],
  );

  return (
    <TabBar
      tabOptions={tabOptions}
      selectedTab={selectedTab}
      onItemPress={onTabItemPress}
    />
  );
};

export default withTranslation()(withRouter(Overview));
