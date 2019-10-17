import React, { useCallback } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { Row, Cell } from '../components/common/Layout';
import styled from 'styled-components';
import { ThemedProps } from '../styles/themes';
import dayjs from 'dayjs';
import {
  IRecord,
  RecordType,
  IDepositRecord,
  IState,
  IToken,
  ILoanRecord,
} from '../_stores';
import { useSelector } from 'react-redux';
import { calcCollateralRatio } from '../utils/calcCollateralRatio';
import { convertWeiToDecimal } from '../utils/BigNumber';

interface IProps extends WithTranslation {
  record: IRecord;
  selectedRecordId?: string;
  onRecordSelected: (record: IRecord) => void;
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

const RecordItem = (props: IProps) => {
  const { record, selectedRecordId, onRecordSelected } = props;

  // Selector
  const tokens = useSelector<IState, IToken[]>(
    state => state.common.availableDepositTokens,
  );

  // Callback
  const onRowSelected = useCallback((r: any) => () => onRecordSelected(r), [
    onRecordSelected,
  ]);

  if (record.recordType === RecordType.Deposit) {
    const depositRecord = record as IDepositRecord;

    const depositToken = tokens.find(
      token => token.tokenAddress === depositRecord.tokenAddress,
    );

    return (
      <StyledRow
        onClick={onRowSelected(record)}
        className={
          selectedRecordId && selectedRecordId === record.recordId
            ? 'active'
            : ''
        }
      >
        <StyledItemCell>
          {depositToken ? depositToken.tokenSymbol : depositRecord.tokenAddress}
        </StyledItemCell>
        <StyledItemCell>{depositRecord.depositTerm.text}</StyledItemCell>
        <StyledItemCell>
          {depositRecord.depositAmount.toString()}
        </StyledItemCell>
        <StyledItemCell>
          {dayjs(depositRecord.maturedAt).format('YYYY-MM-DD')}
        </StyledItemCell>
      </StyledRow>
    );
  } else {
    const loanRecord = record as ILoanRecord;

    const loanToken = tokens.find(
      token => token.tokenAddress === loanRecord.loanTokenAddress,
    );

    const collateralToken = tokens.find(
      token => token.tokenAddress === loanRecord.collateralTokenAddress,
    );

    if (!collateralToken || !loanToken) {
      return null;
    }

    const collateralRatio = calcCollateralRatio(
      convertWeiToDecimal(loanRecord.collateralAmount),
      convertWeiToDecimal(loanRecord.remainingDebt),
      collateralToken.price,
      loanToken.price,
    );

    return (
      <StyledRow
        onClick={onRowSelected(record)}
        className={
          selectedRecordId && selectedRecordId === loanRecord.recordId
            ? 'active'
            : ''
        }
      >
        <StyledItemCell>
          {loanRecord.loanAmount} {loanToken.tokenSymbol}
        </StyledItemCell>
        <StyledItemCell>
          {loanRecord.collateralAmount} {collateralToken.tokenSymbol}
        </StyledItemCell>
        <StyledItemCell>{collateralRatio} %</StyledItemCell>
        <StyledItemCell>
          {dayjs(loanRecord.createdAt)
            .add(loanRecord.loanTerm.value, 'day')
            .format('YYYY-MM-DD')}
        </StyledItemCell>
      </StyledRow>
    );
  }
};

export default withTranslation()(RecordItem);
