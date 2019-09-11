import * as React from 'react';
import styled, { css } from 'styled-components';
import { ThemedProps } from '../../styles/themes';

interface IProps {
  type?: string;
  fullWidth?: boolean;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
  [propName: string]: any;
}

const StyledInputGroup = styled.div`
  display: flex;

  > input {
    flex: 1;
    color: ${(props: ThemedProps) => props.theme.fontColors.inverted};

    &:not(:last-child) {
      border-radius: ${(props: ThemedProps) => props.theme.borderRadius.medium}
        0 0 ${(props: ThemedProps) => props.theme.borderRadius.medium};
      margin-right: -1px;
    }
  }

  > .addon {
    flex: 0;
    min-width: 70px;
    text-align: center;
    &:first-child {
      margin-right: -1px;

      & ~ input {
        border-radius: 0
          ${(props: ThemedProps) => props.theme.borderRadius.medium}
          ${(props: ThemedProps) => props.theme.borderRadius.medium} 0;
      }
    }

    &.text {
      display: block;
      width: 100%;
      font-size: 14px;
      padding: 10px;
      height: 100%;
      border: 1px solid
        ${(props: ThemedProps) => props.theme.borderColor.primary};
      background-color: ${(props: ThemedProps) =>
        props.theme.backgroundColor.secondary};

      &:last-child {
        border-radius: 0
          ${(props: ThemedProps) => props.theme.borderRadius.medium}
          ${(props: ThemedProps) => props.theme.borderRadius.medium} 0;
      }

      &:first-child {
        border-radius: ${(props: ThemedProps) =>
            props.theme.borderRadius.medium}
          0 0 ${(props: ThemedProps) => props.theme.borderRadius.medium};
      }
    }
  }
`;

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

const renderAddon = (content: React.ReactNode) => {
  if (typeof content === 'string') {
    return <div className="addon text">{content}</div>;
  } else {
    return <div className="addon">{content}</div>;
  }
};

const Input = (props: IProps) => {
  return (
    <StyledInputGroup>
      {props.prefix && renderAddon(props.prefix)}
      <StyledInput {...props} />
      {props.suffix && renderAddon(props.suffix)}
    </StyledInputGroup>
  );
};

export default Input;
