import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { Row, Cell } from '../components/common/Layout';
import styled from 'styled-components';
import { ThemedProps } from '../styles/themes';
import dayjs from 'dayjs';
import {
  IRecord,
  ILoanRecord,
  IToken,
  IDepositRecord,
  ITransaction,
} from '../stores';
import { EventName } from '../utils/MetaMaskProvider';

interface IProps extends WithTranslation {
  tokens: IToken[];
  record: IRecord;
  transactions: ITransaction[];
}

const StyledTransactionList = styled.div`
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
  tokens: IToken[],
) => {
  if (
    [EventName.RepayLoanSucceed, EventName.LoanSucceed].indexOf(
      transaction.event,
    ) >= 0
  ) {
    const loanRecord = record as ILoanRecord;
    const loanToken = tokens.find(
      token => token.tokenAddress === loanRecord.loanTokenAddress,
    );
    return t(`transaction_list_${transaction.event}`, {
      amount: transaction.amount,
      symbol: loanToken && loanToken.tokenSymbol,
    });
  } else if ([EventName.AddCollateralSucceed].indexOf(transaction.event) >= 0) {
    const loanRecord = record as ILoanRecord;
    const collateralToken = tokens.find(
      token => token.tokenAddress === loanRecord.collateralTokenAddress,
    );

    return t(`transaction_list_${transaction.event}`, {
      amount: transaction.amount,
      symbol: collateralToken && collateralToken.tokenSymbol,
    });
  } else {
    const depositRecord = record as IDepositRecord;
    const depositToken = tokens.find(
      token => token.tokenAddress === depositRecord.tokenAddress,
    );

    return t(`transaction_list_${transaction.event}`, {
      amount: transaction.amount,
      symbol: depositToken && depositToken.tokenSymbol,
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
            {renderTransactionDescription(
              props.t,
              transaction,
              props.record,
              props.tokens,
            )}
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
