import * as React from 'react';
import styled, { css } from 'styled-components';
import { ThemedProps } from '../../styles/themes';

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
      border-color: ${p => p.theme.colors.primary};
      color: ${p => p.theme.fontColors.inverted};
      background-color: ${p => p.theme.colors.primary};

      &:hover {
        background: ${p => p.theme.colors.primaryLight};
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
`;

const Button = (props: IProps) => {
  const { children } = props;

  return <StyledButton {...props}>{children}</StyledButton>;
};

export default Button;
