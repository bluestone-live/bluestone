import * as React from 'react';
import styled from 'styled-components';
import { Link, LinkProps } from 'react-router-dom';

const StyledAnchor = styled(Link)`
  color: ${props => props.theme.fontColor};
  text-decoration: none;
  cursor: pointer;

  :hover {
    color: ${props => props.theme.primaryColor};
  }
`;

const Anchor = (props: LinkProps) => {
  const { children } = props;
  return <StyledAnchor {...props}>{children}</StyledAnchor>;
};

export default Anchor;
