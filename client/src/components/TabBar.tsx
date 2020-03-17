import React, { useMemo } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { withRouter, RouteComponentProps } from 'react-router';
import Menu, { ClickParam } from 'antd/lib/menu';

export enum TabType {
  Deposit = '/deposit',
  Borrow = '/borrow',
  Account = '/account?fromUser=1',
}

export interface ITabOption {
  title: string;
  type: TabType;
  icon: React.ReactElement;
}

interface IProps extends WithTranslation, RouteComponentProps {
  selectedTab?: TabType;
  tabOptions: ITabOption[];
  onItemClick: (e: ClickParam) => void;
  desktop?: boolean;
}

const StyledTabBar = (props: IProps) => {
  const { selectedTab, tabOptions, onItemClick } = props;

  const tabWidth = useMemo(() => `${Math.round(100 / tabOptions.length)}%`, [
    tabOptions,
  ]);

  return (
    <Menu
      className={`tab-bar ${props.desktop ? 'desktop' : ''}`}
      mode="horizontal"
      onClick={onItemClick}
      selectedKeys={[selectedTab || '']}
    >
      {tabOptions.map(option => (
        <Menu.Item key={option.type} style={{ width: tabWidth }}>
          <div className={`tab-item ${props.desktop ? 'desktop' : ''}`}>
            <div className="icon">{option.icon}</div>
            {option.title}
          </div>
        </Menu.Item>
      ))}
    </Menu>
  );
};

export default withTranslation()(withRouter(StyledTabBar));
