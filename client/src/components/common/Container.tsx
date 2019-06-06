import * as React from 'react';
import styled, { css } from 'styled-components';

interface IProps {
  children: React.ReactChildren;
  maxWidth?: string;
}

const StyledContainer = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 900px;

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
