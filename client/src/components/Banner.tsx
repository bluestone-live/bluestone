import React, { useMemo, useState, useCallback } from 'react';
import Button from 'antd/lib/button';
import Icon from 'antd/lib/icon';
import Modal from 'antd/lib/modal';
import { withTranslation, WithTranslation } from 'react-i18next';

export enum BannerType {
  Success = 'success',
  Warning = 'warning',
}

interface IProps extends WithTranslation {
  bannerType: BannerType;
  bannerModalContent?: string;
  children: string;
  onCloseButtonClick: () => void;
}

const Banner = (props: IProps) => {
  const {
    children,
    bannerType,
    bannerModalContent,
    onCloseButtonClick,
    t,
  } = props;

  const bannerIcon = useMemo(() => {
    if (bannerType === BannerType.Success) {
      return <Icon type="check" />;
    }
    if (bannerType === BannerType.Warning) {
      return <Icon type="lock" />;
    }
    return null;
  }, [bannerType]);

  const [bannerModalVisible, setBannerModalVisible] = useState(false);

  const showBannerModal = useCallback(() => setBannerModalVisible(true), []);
  const hideBannerModal = useCallback(() => setBannerModalVisible(false), []);

  return (
    <div className={`banner ${bannerType}`}>
      <div className="banner-content">
        <div onClick={showBannerModal}>
          {bannerIcon}
          {children}
        </div>
        <Button size="small" onClick={onCloseButtonClick}>
          {t('banner_button_close')}
        </Button>
      </div>
      {bannerModalContent && (
        <Modal
          title={children}
          visible={bannerModalVisible}
          closable={false}
          footer={
            <Button type="primary" size="large" block onClick={hideBannerModal}>
              {t('banner_modal_close')}
            </Button>
          }
        >
          {bannerModalContent}
        </Modal>
      )}
    </div>
  );
};

export default withTranslation()(Banner);
