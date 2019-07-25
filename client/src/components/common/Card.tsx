import * as React from 'react';
import styled from 'styled-components';
import { ThemedProps } from '../../styles/themes';

interface IProps {
  children: React.ReactChild | React.ReactChild[] | undefined | null | object;
  className?: string;
}

const StyledCard = styled.div`
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  background-color: ${(props: ThemedProps) =>
    props.theme.backgroundColor.primary};
  border-radius: ${(props: ThemedProps) => props.theme.borderRadius.small};
  padding: ${(props: ThemedProps) => props.theme.gap.small};
  box-sizing: border-box;

  &::after {
    content: '';
    display: table;
    clear: both;
  }
`;

export default ({ children, className }: IProps) => {
  return <StyledCard className={className}>{children}</StyledCard>;
};
