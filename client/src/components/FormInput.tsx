import React, {
  ChangeEvent,
  useMemo,
  useCallback,
  Fragment,
  useState,
} from 'react';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Icon from 'antd/lib/icon';
import Modal from 'antd/lib/modal';
import { Button } from 'antd';

interface IFormItemTip {
  title: string;
  content: React.ReactChild | React.ReactChild[];
}

interface IProps {
  label: string | React.ReactNode;
  size?: 'small' | 'default' | 'large';
  type: string;
  defaultValue: string;
  suffix: React.ReactNode | string;
  tip?: IFormItemTip;
  extra?: React.ReactElement | string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const FormInput = (props: IProps) => {
  const {
    size,
    type,
    defaultValue,
    suffix,
    tip,
    extra,
    value,
    onChange,
  } = props;

  const [tipModalVisible, setTipModalVisible] = useState(false);

  const showTipModal = useCallback(() => setTipModalVisible(true), [tip]);
  const hideTipModal = useCallback(() => setTipModalVisible(false), [tip]);

  const label = useMemo(() => {
    if (typeof props.label === 'string' && tip) {
      return (
        <span>
          {props.label}
          <Icon
            className="tip-icon"
            type="question-circle"
            theme="filled"
            onClick={showTipModal}
          />
        </span>
      );
    }
    return props.label;
  }, [props.label]);

  return (
    <Fragment>
      <Form.Item label={label} className="form-input">
        <Input
          size={size}
          type={type}
          defaultValue={defaultValue}
          value={value}
          suffix={suffix}
          onChange={onChange}
        />
        <div className="form-input__extra">{extra}</div>
      </Form.Item>
      {tip && (
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
      )}
    </Fragment>
  );
};

export default FormInput;
