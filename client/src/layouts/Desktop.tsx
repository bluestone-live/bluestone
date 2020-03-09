import React, { useCallback, useState } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter, Route } from 'react-router';
import { useDispatch } from 'react-redux';
import { useDefaultAccount, useBanner, ViewActions } from '../stores';
import { ClickParam } from 'antd/lib/menu';
import Banner from '../components/Banner';
import { useGlobalInit } from './useGlobalInit';
import TabBar from '../components/TabBar';
import logo from '../styles/images/bluestone.svg';
import { useComponentMounted } from '../utils/useEffectAsync';
import { getService } from '../services';
import Modal from 'antd/lib/modal';

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

  // State
  const [showNetworkAlert, setShowNetworkAlert] = useState(false);

  useComponentMounted(async () => {
    try {
      await getService();
    } catch (e) {
      setShowNetworkAlert(true);
    }
  });

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
      <Modal
        title={t('layout_network_alert_title')}
        visible={showNetworkAlert}
        closable={false}
        footer={[]}
      >
        <p>{t('layout_network_alert_content')}</p>
      </Modal>
    </div>
  );
};

export default withTranslation()(withRouter(DesktopLayout));
