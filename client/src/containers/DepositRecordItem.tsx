import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { IDepositRecord } from '../constants/Record';
import { Row, Cell } from '../components/common/Layout';
import styled from 'styled-components';
import { ThemedProps } from '../styles/themes';
import dayjs from 'dayjs';

interface IProps extends WithTranslation {
  depositRecord: IDepositRecord;
  selectedRecordAddress?: string;
  onRecordSelected: (recordAddress: string) => void;
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

class DepositRecordItem extends React.Component<IProps> {
  onRowSelected = (recordAddress: string) => () =>
    this.props.onRecordSelected(recordAddress);

  render() {
    const { depositRecord, selectedRecordAddress } = this.props;

    return (
      <StyledRow
        onClick={this.onRowSelected(depositRecord.recordAddress)}
        className={
          selectedRecordAddress &&
          selectedRecordAddress === depositRecord.recordAddress
            ? 'active'
            : ''
        }
      >
        <StyledItemCell>{depositRecord.token.symbol}</StyledItemCell>
        <StyledItemCell>{depositRecord.term.text}</StyledItemCell>
        <StyledItemCell>{depositRecord.depositAmount}</StyledItemCell>
        <StyledItemCell>
          {dayjs(depositRecord.maturedAt).format('YYYY-MM-DD')}
        </StyledItemCell>
      </StyledRow>
    );
  }
}

export default withTranslation()(DepositRecordItem);
