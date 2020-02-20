import React, { useMemo, Fragment, useState, useCallback } from 'react';
import Form from 'antd/lib/form';
import Modal from 'antd/lib/modal';
import Icon from 'antd/lib/icon';
import Button from 'antd/lib/button';
import { WithTranslation, withTranslation } from 'react-i18next';

interface IProps extends WithTranslation {
  currentCollateralRatio?: string;
  minCollateralRatio?: string;
}

const CollateralCoverageRatio = (props: IProps) => {
  const { currentCollateralRatio, minCollateralRatio, t } = props;

  const ratioStatus = useMemo(() => {
    if (currentCollateralRatio && minCollateralRatio) {
      return Number.parseFloat(currentCollateralRatio) >=
        Number.parseFloat(minCollateralRatio)
        ? 'safe'
        : 'danger';
    }
  }, [currentCollateralRatio, minCollateralRatio]);

  const tip = useMemo(
    () => ({
      title: t('collateral_coverage_ratio_modal_title'),
      content: (
        <p>
          {t('collateral_coverage_ratio_modal_content', { minCollateralRatio })}
        </p>
      ),
    }),
    [],
  );

  const [tipModalVisible, setTipModalVisible] = useState(false);

  const showTipModal = useCallback(() => setTipModalVisible(true), []);
  const hideTipModal = useCallback(() => setTipModalVisible(false), []);

  return (
    <Fragment>
      <Form.Item
        label={
          <span>
            Collateral Ratio
            <Icon
              className="tip-icon"
              type="question-circle"
              theme="filled"
              onClick={showTipModal}
            />
          </span>
        }
        className="collateral-coverage-ratio"
      >
        <span className={`current ${ratioStatus}`}>
          {currentCollateralRatio}%
        </span>
        <span> / {minCollateralRatio}%</span>
      </Form.Item>
      <Modal
        visible={tipModalVisible}
        closable={false}
        title={tip.title}
        footer={
          <Button type="primary" size="large" block onClick={hideTipModal}>
            Close
          </Button>
        }
      >
        {tip.content}
      </Modal>
    </Fragment>
  );
};

export default withTranslation()(CollateralCoverageRatio);
