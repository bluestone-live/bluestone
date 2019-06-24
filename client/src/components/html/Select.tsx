import * as React from 'react';
import styled from 'styled-components';
import { ThemedProps } from '../../styles/themes';

interface IProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const StyledSelect = styled.select`
  font-size: ${(props: ThemedProps) => props.theme.fontSize.medium};
  color: ${(props: ThemedProps) => props.theme.fontColors.primary};
  padding: ${(props: ThemedProps) => props.theme.gap.small};
  margin: 0;
  border: 1px solid ${(props: ThemedProps) => props.theme.borderColor.secondary};
  border-radius: ${(props: ThemedProps) => props.theme.borderRadius.medium};
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
  background-color: #fff;

  &::-ms-expand {
    display: none;
  }

  & option {
    font-weight: normal;
  }
`;

export default (props: IProps) => (
  <StyledSelect {...props}>{props.children}</StyledSelect>
);
