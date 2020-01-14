import React from 'react';
import Form from 'antd/lib/form';
import { TFunctionResult } from 'i18next';

interface IProps {
  label: string;
  children: TFunctionResult | React.ReactChild | React.ReactChild[];
}

const TextBox = (props: IProps) => {
  const { label, children } = props;
  return (
    <Form.Item label={label} className="text-box">
      <span className="ant-form-text">{children}</span>
    </Form.Item>
  );
};

export default TextBox;
