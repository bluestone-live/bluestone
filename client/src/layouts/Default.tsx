import React, { useCallback } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router';
import { useDispatch } from 'react-redux';
import { useDefaultAccount, useBanner, ViewActions } from '../stores';
import TabBar from '../components/TabBar';
import { ClickParam } from 'antd/lib/menu';
import Banner from '../components/Banner';
import { useGlobalInit } from './useGlobalInit';
import Brand from '../components/Brand';
import CustomIcon from '../components/CustomIcon';

interface IProps extends WithTranslation, RouteComponentProps {
  children: React.ReactChild;
  title: string;
}

const OverviewLayout = (props: IProps) => {
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
  const { banner, bannerType, bannerModalContent } = useBanner();

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
    <div className="layout default">
      {banner && (
        <Banner
          onCloseButtonClick={onBannerCloseButtonClick}
          bannerType={bannerType}
          bannerModalContent={bannerModalContent}
        >
          {banner}
        </Banner>
      )}
      <Brand />
      <div className="container">
        <div className="default__title">
          <CustomIcon type="back" onClick={onBackButtonClick} />
          {t(title)}
        </div>
        {accountAddress && children}
      </div>
      <TabBar
        tabOptions={tabOptions}
        selectedTab={selectedTab && selectedTab.type}
        onItemClick={onTabItemClick}
      />
    </div>
  );
};

export default withTranslation()(withRouter(OverviewLayout));
