import * as React from 'react';
import styled from 'styled-components';
import { Link, LinkProps } from 'react-router-dom';
import { ThemedProps } from '../../styles/themes';

const StyledAnchor = styled(Link)`
  color: ${(props: ThemedProps) => props.theme.fontColors.primary};
  text-decoration: none;
  cursor: pointer;

  :hover {
    color: ${(props: ThemedProps) => props.theme.fontColors.highlight};
  }
`;

const Anchor = (props: LinkProps) => {
  const { children } = props;
  return <StyledAnchor {...props}>{children}</StyledAnchor>;
};

export default Anchor;
