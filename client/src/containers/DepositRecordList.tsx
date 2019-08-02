import * as React from 'react';
import { IDepositRecord } from '../constants/Record';
import { Row, Cell } from '../components/common/Layout';
import styled from 'styled-components';
import { ThemedProps } from '../styles/themes';
import DepositRecordItem from './DepositRecordItem';
import { WithTranslation, withTranslation } from 'react-i18next';

interface IProps extends WithTranslation {
  depositRecords: IDepositRecord[];
  currentToken: string;
  onRecordSelected: (recordAddress: string) => void;
  selectedRecordAddress?: string;
}

const StyledHeaderCell = styled(Cell)`
  height: 50px;
  text-align: center;
  font-size: ${(props: ThemedProps) => props.theme.fontSize.medium};
  padding: ${(props: ThemedProps) => props.theme.gap.small};
  color: ${(props: ThemedProps) => props.theme.fontColors.secondary};
`;

const DepositRecordList = (props: IProps) => {
  return (
    <div className="deposit-record-list">
      <Row>
        <StyledHeaderCell>{props.t('token')!}</StyledHeaderCell>
        <StyledHeaderCell>{props.t('term')!}</StyledHeaderCell>
        <StyledHeaderCell>{props.t('amount')!}</StyledHeaderCell>
        <StyledHeaderCell>{props.t('matured_at')!}</StyledHeaderCell>
      </Row>
      {props.depositRecords.map(record => (
        <DepositRecordItem
          selectedRecordAddress={props.selectedRecordAddress}
          onRecordSelected={props.onRecordSelected}
          key={record.recordAddress}
          depositRecord={record}
        />
      ))}
    </div>
  );
};

export default withTranslation()(DepositRecordList);
