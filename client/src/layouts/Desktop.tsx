import React, { useCallback } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter, Route } from 'react-router';
import { useDispatch } from 'react-redux';
import { useDefaultAccount, useBanner, ViewActions } from '../stores';
import { ClickParam } from 'antd/lib/menu';
import Banner from '../components/Banner';
import { useGlobalInit } from './useGlobalInit';
import TabBar from '../components/TabBar';
import logo from '../styles/images/lendhoo.svg';

interface IProps extends WithTranslation, RouteComponentProps {
  children: React.ReactChild;
  title: string;
}

const DesktopLayout = (props: IProps) => {
  const {
    children,
    title,
    history,
    location: { pathname, search },
    t,
  } = props;
  const dispatch = useDispatch();
  // Selector
  const accountAddress = useDefaultAccount();
  const { banner, bannerType } = useBanner();

  // Initialize
  const { tabOptions, selectedTab } = useGlobalInit(
    pathname,
    search,
    dispatch,
    t,
  );

  // Callback
  const onTabItemClick = useCallback((e: ClickParam) => {
    history.push(e.key);
  }, []);

  const onBannerCloseButtonClick = useCallback(
    () => dispatch(ViewActions.removeBanner()),
    [],
  );

  const onBackButtonClick = useCallback(() => history.goBack(), []);

  return (
    <div className="layout desktop">
      {banner && (
        <Banner
          onCloseButtonClick={onBannerCloseButtonClick}
          bannerType={bannerType}
        >
          {banner}
        </Banner>
      )}

      <header>
        <img className="logo" src={logo} alt="LendHoo" />
        <div className="tab-menus">
          <TabBar
            tabOptions={tabOptions}
            selectedTab={selectedTab && selectedTab.type}
            onItemClick={onTabItemClick}
            desktop
          />
        </div>
      </header>

      <div className="container">
        <div className="default__title">{t(title)}</div>
        {accountAddress && children}
      </div>

      <footer>
        <span className="copyrights">
          Copyright &copy; 2019 Bluestone All Rights Reserved
        </span>
        <div className="logo">
          <img src={logo} alt="Logo" />
        </div>
      </footer>
    </div>
  );
};

export default withTranslation()(withRouter(DesktopLayout));
