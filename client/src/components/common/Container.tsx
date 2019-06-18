import * as React from 'react';
import styled, { css } from 'styled-components';

interface IProps {
  children: React.ReactChild | React.ReactChild[];
  maxWidth?: string;
}

const StyledContainer = styled.div`
  ${(props: IProps) =>
    props.maxWidth &&
    css`
      max-width: ${props.maxWidth};
    `}
`;

const Container = (props: IProps) => {
  const { children } = props;
  return <StyledContainer {...props}>{children}</StyledContainer>;
};

export default Container;
