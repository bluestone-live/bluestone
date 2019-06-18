import * as React from 'react';
import styled from 'styled-components';

const StyledInput = styled.input`
  font-size: ${props => props.theme.fontSize.medium};
  padding: 10px;
  width: 100%;
  border: 1px solid ${props => props.theme.borderColor.secondary};
  border-radius: ${props => props.theme.borderRadius};
  outline: none;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Input = (props: any) => {
  return <StyledInput {...props} />;
};

export default Input;
