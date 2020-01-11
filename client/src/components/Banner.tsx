import React, { useMemo } from 'react';
import Button from 'antd/lib/button';
import Icon from 'antd/lib/icon';

export enum BannerType {
  Success = 'success',
  Warning = 'warning',
}

interface IProps {
  bannerType: BannerType;
  children: string;
  onCloseButtonClick: () => void;
}

const Banner = (props: IProps) => {
  const { children, bannerType, onCloseButtonClick } = props;

  const bannerIcon = useMemo(() => {
    if (bannerType === BannerType.Success) {
      return <Icon type="check" />;
    }
    if (bannerType === BannerType.Warning) {
      return <Icon type="lock" />;
    }
    return null;
  }, [bannerType]);

  return (
    <div className={`banner ${bannerType}`}>
      <div className="banner-content">
        {bannerIcon}
        {children}
        <Button size="small" onClick={onCloseButtonClick}>
          Close
        </Button>
      </div>
    </div>
  );
};

export default Banner;
