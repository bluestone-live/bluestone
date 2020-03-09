import React, { useCallback, useState } from 'react';
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
import { useComponentMounted } from '../utils/useEffectAsync';
import { getService } from '../services';
import Modal from 'antd/lib/modal';

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

  const onBackButtonClick = useCallback(() => {
    if (
      /account\/borrow/.test(location.pathname) ||
      /account\/deposit/.test(location.pathname)
    ) {
      history.push('/account');
    } else {
      history.goBack();
    }
  }, []);

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

export default withTranslation()(withRouter(OverviewLayout));
