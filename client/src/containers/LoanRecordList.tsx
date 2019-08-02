import * as React from 'react';
import { ILoanRecord } from '../constants/Record';
import { Row, Cell } from '../components/common/Layout';
import styled from 'styled-components';
import { ThemedProps } from '../styles/themes';
import { WithTranslation, withTranslation } from 'react-i18next';
import LoanRecordItem from './LoanRecordItem';

interface IProps extends WithTranslation {
  loanRecords: ILoanRecord[];
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
    <div className="loan-record-list">
      <Row>
        <StyledHeaderCell>{props.t('borrow')!}</StyledHeaderCell>
        <StyledHeaderCell>{props.t('collateral')!}</StyledHeaderCell>
        <StyledHeaderCell>{props.t('collateral_ratio')!}</StyledHeaderCell>
        <StyledHeaderCell>{props.t('expired_at')!}</StyledHeaderCell>
      </Row>
      {props.loanRecords.map(record => (
        <LoanRecordItem
          selectedRecordAddress={props.selectedRecordAddress}
          onRecordSelected={props.onRecordSelected}
          key={record.recordAddress}
          loanRecord={record}
        />
      ))}
    </div>
  );
};

export default withTranslation()(DepositRecordList);
