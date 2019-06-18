import * as React from 'react';
import styled, { css } from 'styled-components';
import { ThemedProps } from '../../styles/themes';

interface IFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactChild[];
  horizontal?: boolean;
}

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  margin: ${(props: ThemedProps) => props.theme.gap.medium} auto;

  ${(props: ThemedProps<IFormProps>) =>
    props.horizontal &&
    css`
      flex-direction: row;
    `}
`;

const Form = (props: IFormProps) => {
  const { children } = props;
  return <StyledForm {...props}>{children}</StyledForm>;
};

interface IFromItemProps {
  children: React.ReactChild | React.ReactChild[];
}

const StyledFormItem = styled.div`
  margin: ${(props: ThemedProps) => props.theme.gap.medium};
`;

Form.Item = (props: IFromItemProps) => {
  const { children } = props;
  return <StyledFormItem>{children}</StyledFormItem>;
};

export default Form;
