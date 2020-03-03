import React, { useCallback, useMemo } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router';
import { useDispatch } from 'react-redux';
import {
  useDefaultAccount,
  useBanner,
  ViewActions,
  useNetwork,
} from '../stores';
import TabBar from '../components/TabBar';
import { ClickParam } from 'antd/lib/menu';
import Banner from '../components/Banner';
import { useGlobalInit } from './useGlobalInit';
import Brand from '../components/Brand';
import Button from 'antd/lib/button';

interface IProps extends WithTranslation, RouteComponentProps {
  children: React.ReactChild;
}

const OverviewLayout = (props: IProps) => {
  const {
    children,
    history,
    location: { pathname, search },
    t,
  } = props;
  const dispatch = useDispatch();
  // Selector
  const accountAddress = useDefaultAccount();
  const { banner, bannerType } = useBanner();
  const network = useNetwork();

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

  const goToMintPage = useCallback(() => history.push('/mint'), []);
  const openMonitorPage = useCallback(
    () => window.open('/monitor', 'bluestone_monitor'),
    [],
  );

  const tip = useMemo(() => {
    if (network === 'main') {
      return null;
    }
    if (pathname === '/deposit') {
      return (
        <div className="tip" onClick={goToMintPage}>
          Mint some tokens for testing
          <Button type="default" size="small">
            Go
          </Button>
        </div>
      );
    }
    return (
      <div className="tip" onClick={openMonitorPage}>
        View the monitor page
        <Button type="default" size="small">
          Go
        </Button>
      </div>
    );
  }, [network]);

  return (
    <div className="layout overview">
      {tip}
      {banner && (
        <Banner
          onCloseButtonClick={onBannerCloseButtonClick}
          bannerType={bannerType}
        >
          {banner}
        </Banner>
      )}
      <Brand />
      <div className="container">{accountAddress && children}</div>
      <TabBar
        tabOptions={tabOptions}
        selectedTab={selectedTab && selectedTab.type}
        onItemClick={onTabItemClick}
      />
    </div>
  );
};

export default withTranslation()(withRouter(OverviewLayout));
