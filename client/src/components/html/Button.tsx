import * as React from 'react';
import styled, { css } from 'styled-components';

interface IProps {
  children: React.ReactChild[];
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  primary?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
}

const StyledButton = styled.button`
  border-width: 1px;
  border-style: solid;
  border-color: ${props => props.theme.borderColor};
  border-radius: ${props => props.theme.borderRadius};
  color: ${props => props.theme.fontColor};
  background-color: white;
  padding: 8px 16px;
  letter-spacing: 1px;
  transition: background 0.3s;
  cursor: pointer;
  outline: none;

  ${(props: IProps) =>
    props.primary &&
    css`
      border-color: ${p => p.theme.primaryColor};
      color: white;
      background-color: ${p => p.theme.primaryColor};

      &:hover {
        background: ${p => p.theme.primaryColorLight};
      }
    `};

  ${(props: IProps) =>
    props.fullWidth &&
    css`
      width: 100%;
    `};

  ${(props: IProps) =>
    props.disabled &&
    css`
      cursor: not-allowed;
      background-color: #ccc;
      border-color: #ccc;

      &:hover {
        background: #ccc;
      }
    `};
`;

const Button = (props: IProps) => {
  const { children } = props;

  return <StyledButton {...props}>{children}</StyledButton>;
};

export default Button;
