import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { ITransaction } from '../constants/Transaction';
import { Row, Cell } from '../components/common/Layout';
import TextBox from '../components/common/TextBox';
import styled from 'styled-components';
import { ThemedProps } from '../styles/themes';
import dayjs from 'dayjs';
import { IRecord, IDepositRecord, ILoanRecord } from '../constants/Record';
import { EventName } from '../constants/Event';

interface IProps extends WithTranslation {
  record: IRecord;
  transactions: ITransaction[];
}

const StyledTransactionList = styled.div`
  margin-top: ${(props: ThemedProps) => props.theme.gap.large};
  border-top: 1px solid
    ${(props: ThemedProps) => props.theme.borderColor.secondary};
  max-height: ${6 * 35}px;
`;

const StyledHead = styled(Cell)`
  font-size: ${(props: ThemedProps) => props.theme.fontSize.large};
  color: ${(props: ThemedProps) => props.theme.fontColors.secondary};
  align-items: flex-start;
  padding: ${(props: ThemedProps) => props.theme.gap.medium};
`;

const StyledRow = styled(Row)`
  height: 35px;

  & > div {
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: ${(props: ThemedProps) => props.theme.gap.medium};
  }
`;

const StyledExternalLink = styled.a`
  color: ${(props: ThemedProps) => props.theme.colors.primaryLight};
`;

const renderTransactionDescription = (
  t: any,
  transaction: ITransaction,
  record: IRecord,
) => {
  if (
    [EventName.RepayLoanSuccessful, EventName.LoanSuccessful].indexOf(
      transaction.event,
    ) >= 0
  ) {
    const loanRecord = record as ILoanRecord;
    return t(`transaction_list_${transaction.event}`, {
      amount: transaction.amount,
      symbol: loanRecord.loanToken.symbol,
    });
  } else if (
    [EventName.AddCollateralSuccessful].indexOf(transaction.event) >= 0
  ) {
    const loanRecord = record as ILoanRecord;
    return t(`transaction_list_${transaction.event}`, {
      amount: transaction.amount,
      symbol: loanRecord.collateralToken.symbol,
    });
  } else {
    const depositRecord = record as IDepositRecord;
    return t(`transaction_list_${transaction.event}`, {
      amount: transaction.amount,
      symbol: depositRecord.token.symbol,
    });
  }
};

const TransactionList = (props: IProps) => {
  return (
    <StyledTransactionList className="transaction-list">
      <Row>
        <StyledHead>{props.t('transactions')}</StyledHead>
      </Row>
      {props.transactions.map(transaction => (
        <StyledRow key={transaction.transactionHash}>
          <Cell>
            {renderTransactionDescription(props.t, transaction, props.record)}
          </Cell>
          <Cell>
            <StyledExternalLink
              href={`https://etherscan.io/tx/${transaction.transactionHash}`}
              target="bluestone_view_transaction"
            >
              {dayjs(transaction.time).format('YYYY-MM-DD HH:mm')}
            </StyledExternalLink>
          </Cell>
        </StyledRow>
      ))}
    </StyledTransactionList>
  );
};

export default withTranslation()(TransactionList);
