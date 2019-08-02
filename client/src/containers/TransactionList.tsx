import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { ITransaction } from '../constants/Transaction';
import { Row, Cell } from '../components/common/Layout';
import TextBox from '../components/common/TextBox';
import styled from 'styled-components';
import { ThemedProps } from '../styles/themes';

interface IProps extends WithTranslation {
  transactions: ITransaction[];
}

const StyledTransactionList = styled.div`
  margin-top: ${(props: ThemedProps) => props.theme.gap.large};
  border-top: 1px solid
    ${(props: ThemedProps) => props.theme.borderColor.secondary};
  max-height: ${6 * 35}px;
`;

const StyledHead = styled(Cell)`
  color: ${(props: ThemedProps) => props.theme.fontColors.secondary};
`;

const StyledRow = styled(Row)`
  height: 35px;

  & > div {
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const StyledExternalLink = styled.a`
  color: ${(props: ThemedProps) => props.theme.colors.primaryLight};
`;

const TransactionList = (props: IProps) => {
  return (
    <StyledTransactionList className="transaction-list">
      <StyledRow>
        <StyledHead>{props.t('transaction_type')}</StyledHead>
        <StyledHead>{props.t('transaction_link')}</StyledHead>
      </StyledRow>
      {props.transactions.map(transaction => (
        <StyledRow key={transaction.transactionHash}>
          <Cell>
            <TextBox>{props.t(transaction.event)}</TextBox>
          </Cell>
          <Cell>
            <StyledExternalLink
              href={`https://etherscan.io/tx/${transaction.transactionHash}`}
              target="bluestone_view_transaction"
            >
              {props.t('view_on_etherscan')}
            </StyledExternalLink>
          </Cell>
        </StyledRow>
      ))}
    </StyledTransactionList>
  );
};

export default withTranslation()(TransactionList);
