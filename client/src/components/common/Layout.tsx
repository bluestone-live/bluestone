import * as React from 'react';
import styled from 'styled-components';

interface ILayoutProps {
  children: React.ReactChild | React.ReactChild[] | Element[];
  className?: string;
}

interface ICellProps extends ILayoutProps {
  scale?: number;
}

const StyledRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const StyledCell = styled.div``;

export const Row = (props: ILayoutProps) => {
  return <StyledRow className={props.className}>{props.children}</StyledRow>;
};

export const Cell = (props: ICellProps) => {
  return (
    <StyledCell className={props.className} style={{ flex: props.scale || 1 }}>
      {props.children}
    </StyledCell>
  );
};
