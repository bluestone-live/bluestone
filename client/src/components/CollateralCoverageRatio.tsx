import React, { useMemo, Fragment, useState, useCallback } from 'react';
import Form from 'antd/lib/form';
import Modal from 'antd/lib/modal';
import Icon from 'antd/lib/icon';
import Button from 'antd/lib/button';

interface IProps {
  currentCollateralRatio: number;
  minCollateralRatio: number;
}

const CollateralCoverageRatio = (props: IProps) => {
  const { currentCollateralRatio, minCollateralRatio } = props;

  const ratioStatus = useMemo(
    () => (currentCollateralRatio >= minCollateralRatio ? 'safe' : 'danger'),
    [currentCollateralRatio, minCollateralRatio],
  );

  const tip = useMemo(
    () => ({
      title: 'Notice',
      content: (
        <div>
          {minCollateralRatio} is safe line for the collateral. If below{' '}
          {minCollateralRatio}%, this borrow will be balallala automatically.
          THIS REMINDER NEED TO UPDATE.
        </div>
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

export default CollateralCoverageRatio;
