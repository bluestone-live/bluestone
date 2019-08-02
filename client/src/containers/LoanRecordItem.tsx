import * as React from 'react';
import { ILoanRecord } from '../constants/Record';
import { Row, Cell } from '../components/common/Layout';
import Anchor from '../components/html/Anchor';
import styled from 'styled-components';
import { ThemedProps } from '../styles/themes';
import dayjs from 'dayjs';

interface IProps {
  loanRecord: ILoanRecord;
  onRecordSelected: (recordAddress: string) => void;
  selectedRecordAddress?: string;
}

const StyledItemCell = styled(Cell)`
  height: 50px;
  text-align: center;
  font-size: ${(props: ThemedProps) => props.theme.fontSize.medium};
  padding: ${(props: ThemedProps) => props.theme.gap.small};
`;

const StyledRow = styled(Row)`
  cursor: pointer;
  &.active {
    background-color: ${(props: ThemedProps) =>
      props.theme.backgroundColor.hover};
  }

  &:hover {
    background-color: ${(props: ThemedProps) =>
      props.theme.backgroundColor.hover};
  }
`;

class LoanRecordItem extends React.Component<IProps> {
  onRowSelected = (recordAddress: string) => () =>
    this.props.onRecordSelected(recordAddress);

  render() {
    const { loanRecord, selectedRecordAddress } = this.props;

    const collateralRatio = (loanRecord.loanAmount === 0
      ? 0
      : ((loanRecord.collateralAmount * loanRecord.collateralToken.price!) /
          loanRecord.loanAmount /
          loanRecord.loanToken.price!) *
        100
    ).toFixed(2);

    return (
      <StyledRow
        onClick={this.onRowSelected(loanRecord.recordAddress)}
        className={
          selectedRecordAddress &&
          selectedRecordAddress === loanRecord.recordAddress
            ? 'active'
            : ''
        }
      >
        <StyledItemCell>
          {loanRecord.loanAmount} {loanRecord.loanToken.symbol}
        </StyledItemCell>
        <StyledItemCell>
          {loanRecord.collateralAmount} {loanRecord.collateralToken.symbol}
        </StyledItemCell>
        <StyledItemCell>{collateralRatio}</StyledItemCell>
        <StyledItemCell>
          {dayjs(loanRecord.createdAt)
            .add(loanRecord.term.value, 'day')
            .format('YYYY-MM-DD')}
        </StyledItemCell>
      </StyledRow>
    );
  }
}

export default LoanRecordItem;
