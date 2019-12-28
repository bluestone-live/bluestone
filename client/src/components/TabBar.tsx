import React, { useCallback } from 'react';
import { Tabs } from 'antd';
import { withTranslation, WithTranslation } from 'react-i18next';
import { withRouter, RouteComponentProps } from 'react-router';

export enum TabType {
  Deposit = 'deposit',
  Borrow = 'borrow',
  Account = 'account',
}

export interface ITabOption {
  title: string;
  type: TabType;
  icon: React.ReactElement;
  content: Element | React.ReactChild | React.ReactChild[];
}

interface IProps extends WithTranslation, RouteComponentProps {
  selectedTab: TabType;
  tabOptions: ITabOption[];
  onItemPress: (type: TabType) => () => void;
}

const StyledTabBar = (props: IProps) => {
  const { selectedTab, tabOptions, onItemPress } = props;

  return (
    <Tabs>
      {tabOptions.map(option => (
        <Tabs.TabPane
          tab={
            <div>
              <div>{option.icon}</div>
              {option.title}
            </div>
          }
          key={`tab-bar-${option.type}`}
        >
          {option.content}
        </Tabs.TabPane>
      ))}
    </Tabs>
  );
};

export default withTranslation()(withRouter(StyledTabBar));
