import * as React from 'react';
import styled from 'styled-components';

interface ILayoutProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  children:
    | React.ReactChild
    | React.ReactChild[]
    | Element[]
    | string
    | object
    | null
    | undefined;
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
  const { children, ref, ...restProps } = props;
  return <StyledRow {...restProps}>{children}</StyledRow>;
};

export const Cell = (props: ICellProps) => {
  const { children, ref, scale, ...restProps } = props;
  return (
    <StyledCell {...restProps} style={{ flex: scale || 1 }}>
      {children}
    </StyledCell>
  );
};
