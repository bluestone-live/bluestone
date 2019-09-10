import * as React from 'react';
import styled, { css } from 'styled-components';
import { ThemedProps } from '../../styles/themes';

interface IProps {
  children:
    | React.ReactChild
    | React.ReactChild[]
    | string
    | object
    | undefined
    | null;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  primary?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
}

const StyledButton = styled.button`
  border-width: 1px;
  border-style: solid;
  border-color: ${(props: ThemedProps) => props.theme.borderColor.secondary};
  border-radius: ${(props: ThemedProps) => props.theme.borderRadius.medium};
  color: ${(props: ThemedProps) => props.theme.fontColors.primary};
  background-color: white;
  padding: 8px 16px;
  letter-spacing: 1px;
  transition: background 0.3s;
  cursor: pointer;
  outline: none;

  ${(props: ThemedProps<IProps>) =>
    props.primary &&
    css`
      border-color: ${(p: ThemedProps) => p.theme.colors.primary};
      color: ${(p: ThemedProps) => p.theme.fontColors.default};
      background-color: ${(p: ThemedProps) => p.theme.colors.primary};

      &:hover {
        background: ${(p: ThemedProps) => p.theme.colors.primaryLight};
      }
    `};

  ${(props: ThemedProps<IProps>) =>
    props.fullWidth &&
    css`
      width: 100%;
    `};

  ${(props: ThemedProps<IProps>) =>
    props.disabled &&
    css`
      cursor: not-allowed;
      background-color: ${p => p.theme.backgroundColor.secondary};
      border-color: ${p => p.theme.borderColor.secondary};

      &:hover {
        background: ${p => p.theme.backgroundColor.secondary};
      }
    `};

  & .btn-loading {
    width: 16px;
    height: 16px;
    display: inline-block;
    position: absolute;
    margin-left: -3em;
    border-radius: 50%;
    border: 3px solid #fff;
    border-color: #fff transparent #fff #fff;
    animation: spin 1.2s linear infinite;
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const StyledButtonGroup = styled.div`
  display: flex;
  width: 100%;

  > button {
    flex: 1;
    width: 50%;

    border-right: 0;
    border-radius: 0;

    &:first-child {
      border-radius: ${(props: ThemedProps) =>
        `${props.theme.borderRadius.medium} 0 0 ${props.theme.borderRadius.medium}`};
    }

    &:last-child {
      border-right: 1px solid
        ${(props: ThemedProps) => props.theme.borderColor.secondary};
      border-radius: ${(props: ThemedProps) =>
        `0 ${props.theme.borderRadius.medium} ${props.theme.borderRadius.medium} 0`};
    }
  }
`;

const Button = (props: IProps) => {
  const { children } = props;

  return (
    <StyledButton {...props} disabled={props.disabled || props.loading}>
      {props.loading && <div className="btn-loading" />}
      {children}
    </StyledButton>
  );
};

Button.Group = (props: {
  children:
    | React.ReactChild
    | React.ReactChild[]
    | string
    | object
    | undefined
    | null;
}) => {
  const { children } = props;
  return <StyledButtonGroup>{children}</StyledButtonGroup>;
};

export default Button;
