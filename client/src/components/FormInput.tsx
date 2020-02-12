import React, {
  ChangeEvent,
  useMemo,
  useCallback,
  useState,
  useRef,
} from 'react';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Icon from 'antd/lib/icon';
import Modal from 'antd/lib/modal';
import Button from 'antd/lib/button';

interface IFormItemTip {
  title: string;
  content: React.ReactChild | React.ReactChild[];
}

interface IProps {
  label: string | React.ReactNode;
  size?: 'small' | 'default' | 'large';
  type: string;
  defaultValue?: string | number;
  suffix?: React.ReactNode | string;
  tip?: IFormItemTip;
  extra?: React.ReactElement | string;
  actionButtons?: React.ReactElement[];
  value: string | number;
  className?: string;
  onChange: (value: string) => void;
}

const FormInput = (props: IProps) => {
  const {
    size,
    type,
    defaultValue,
    suffix,
    tip,
    extra,
    actionButtons,
    value,
    className,
    onChange,
  } = props;

  const [tipModalVisible, setTipModalVisible] = useState(false);

  const showTipModal = useCallback(() => setTipModalVisible(true), [tip]);
  const hideTipModal = useCallback(() => setTipModalVisible(false), [tip]);

  const ref = useRef<HTMLDivElement>(null);

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

  const inputWidth = useMemo(() => {
    if (ref && ref.current && actionButtons && actionButtons.length > 0) {
      return `${ref.current.offsetWidth - 90 * actionButtons.length}px`;
    } else {
      return '100%';
    }
  }, [ref.current, actionButtons]);

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (
        type === 'number' &&
        Number.isNaN(Number.parseFloat(e.target.value))
      ) {
        onChange('');
      } else {
        onChange(e.target.value);
      }
    },
    [onChange],
  );

  return (
    <div className={`form-input ${className || ''}`} ref={ref}>
      {ref.current ? (
        <Form.Item label={label}>
          <Input
            size={size}
            type={type}
            defaultValue={defaultValue}
            value={value}
            suffix={suffix}
            onChange={onInputChange}
            style={{ width: inputWidth }}
          />
          {actionButtons && (
            <div className="action-buttons">{...actionButtons}</div>
          )}
          <div className="form-input__extra">{extra}</div>
        </Form.Item>
      ) : null}
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
    </div>
  );
};

export default FormInput;
