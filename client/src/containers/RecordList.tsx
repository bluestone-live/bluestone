import React from 'react';
import { Row, Cell } from '../components/common/Layout';
import styled from 'styled-components';
import { ThemedProps } from '../styles/themes';
import { WithTranslation, withTranslation } from 'react-i18next';

interface IProps extends WithTranslation {
  columns: string[];
  records: any[];
  renderRow: (record: any) => JSX.Element;
}

const StyledHeaderCell = styled(Cell)`
  height: 50px;
  text-align: center;
  font-size: ${(props: ThemedProps) => props.theme.fontSize.medium};
  padding: ${(props: ThemedProps) => props.theme.gap.small};
  color: ${(props: ThemedProps) => props.theme.fontColors.secondary};
`;

const DepositRecordList = (props: IProps) => {
  const { columns, records, renderRow, t } = props;

  return (
    <div className="deposit-record-list">
      <Row>
        {columns.map(column => (
          <StyledHeaderCell key={`th_${column}`}>{t(column)!}</StyledHeaderCell>
        ))}
      </Row>
      {records.map(record => renderRow(record))}
    </div>
  );
};

export default withTranslation()(DepositRecordList);
