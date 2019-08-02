import * as React from 'react';
import styled, { css } from 'styled-components';
import { ThemedProps } from '../../styles/themes';

interface IProps {
  type?: string;
  fullWidth?: boolean;
  [propName: string]: any;
}

const StyledInput = styled.input`
  font-size: ${(props: ThemedProps) => props.theme.fontSize.medium};
  padding: 10px;
  border: 1px solid ${(props: ThemedProps) => props.theme.borderColor.secondary};
  border-radius: ${(props: ThemedProps) => props.theme.borderRadius.medium};
  outline: none;

  &:invalid {
    border-color: ${(props: ThemedProps) => props.theme.borderColor.warning};
  }

  &:focus {
    border-color: ${(props: ThemedProps) => props.theme.colors.primary};
  }

  ${(props: ThemedProps<IProps>) =>
    props.fullWidth &&
    css`
      width: 100%;
    `}
`;

const Input = (props: IProps) => {
  return <StyledInput {...props} />;
};

export default Input;
