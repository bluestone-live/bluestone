import React, { useCallback } from 'react';
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
import Icon from 'antd/lib/icon';

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

  const onTipClick = useCallback(() => history.push('/mint'), []);

  return (
    <div className="layout overview">
      {network !== 'main' && (
        <div className="tip" onClick={onTipClick}>
          Mint some tokens for testing
          <Button type="default" size="small">
            Go
          </Button>
        </div>
      )}
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
