import * as React from 'react';
import styled from 'styled-components';

interface IFormProps {
  onSubmit: (e: Event) => void;
  children: React.ReactChild;
}

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  margin: 0 auto;
`;

const Form = (props: IFormProps) => {
  const { onSubmit, children } = props;
  return <StyledForm onSubmit={onSubmit}>{children}</StyledForm>;
};

interface IFromItemProps {
  children: React.ReactChild;
}

const StyledFormItem = styled.div`
  margin: 8px 0;
`;

Form.Item = (props: IFromItemProps) => {
  const { children } = props;
  return <StyledFormItem>{children}</StyledFormItem>;
};

export default Form;
