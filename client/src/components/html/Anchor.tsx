import * as React from 'react';
import styled, { css } from 'styled-components';

interface IProps {
  children: React.ReactChild | React.ReactChild[];
  href: string;
}

const StyledAnchor = styled.a`
  color: ${props => props.theme.fontColor};
  text-decoration: none;
  cursor: pointer;

  :hover {
    color: ${props => props.theme.primaryColor};
  }
`;

const Anchor = (props: IProps) => {
  const { children } = props;
  return <StyledAnchor {...props}>{children}</StyledAnchor>;
};

export default Anchor;
