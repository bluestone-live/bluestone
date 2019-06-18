import * as React from 'react';
import styled from 'styled-components';
import { ThemedProps } from '../../styles/themes';

const StyledInput = styled.input`
  font-size: ${(props: ThemedProps) => props.theme.fontSize.medium};
  padding: 10px;
  width: 100%;
  border: 1px solid ${(props: ThemedProps) => props.theme.borderColor.secondary};
  border-radius: ${(props: ThemedProps) => props.theme.borderRadius.medium};
  outline: none;

  &:focus {
    border-color: ${(props: ThemedProps) => props.theme.colors.primary};
  }
`;

const Input = (props: any) => {
  return <StyledInput {...props} />;
};

export default Input;
