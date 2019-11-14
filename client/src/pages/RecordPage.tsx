import React, { useCallback } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { withRouter, RouteComponentProps } from 'react-router';
import Card from '../components/common/Card';
import Radio from '../components/common/Radio';
import styled from 'styled-components';
import { ThemedProps } from '../styles/themes';
import parseQuery from '../utils/parseQuery';
import { stringify } from 'querystring';
import { useComponentMounted } from '../utils/useEffectAsync';
import { useSelector } from 'react-redux';
import {
  IState,
  IToken,
  IDepositRecord,
  ILoanRecord,
  IRecord,
  ITransaction,
} from '../stores';
import { getService } from '../services';
import { Row, Cell } from '../components/common/Layout';
import Dropdown, { IDropdownOption } from '../components/common/Dropdown';
import RecordList from '../containers/RecordList';
import RecordItem from '../containers/RecordItem';
import RecordDetail from '../containers/RecordDetail';

interface IProps
  extends WithTranslation,
    RouteComponentProps<{ recordType: string }> {}

enum RecordType {
  Deposit = 'deposit',
  Loan = 'loan',
}

const StyledCard = styled(Card)`
  margin-bottom: ${(props: ThemedProps) => props.theme.gap.medium};
  min-height: 50px;
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledRow = styled(Row)`
  width: 100%;
`;

const StyledListWrapper = styled(Cell)`
  border-right: 1px solid
    ${(props: ThemedProps) => props.theme.borderColor.primary};
`;

const StyledDropDown = styled(Dropdown)`
  border-radius: 0;
  border-width: 0 0 1px 0;
`;

const RecordPage = (props: IProps) => {
  const {
    location,
    history,
    match: {
      params: { recordType },
    },
    t,
  } = props;

  const recordTypeOptions = [
    {
      text: t('deposit'),
      value: RecordType.Deposit,
    },
    {
      text: t('loan'),
      value: RecordType.Loan,
    },
  ];

  const selectedOption = recordTypeOptions.find(
    type => type.value === recordType,
  );

  // Selector
  const depositTokens = useSelector<IState, IToken[]>(
    state => state.common.depositTokens,
  );

  const defaultAccount = useSelector<IState, string>(
    state => state.account.accounts[0],
  );

  const depositRecords = useSelector<IState, IDepositRecord[]>(
    state => state.deposit.depositRecords,
  );

  const loanRecords = useSelector<IState, ILoanRecord[]>(
    state => state.loan.loanRecords,
  );

  const transactions = useSelector<IState, ITransaction[]>(
    state => state.transaction.transactions,
  );

  const isUserActionsLocked = useSelector<IState, boolean>(
    state => state.common.isUserActionsLocked,
  );

  // Initialize
  useComponentMounted(async () => {
    const { depositService, loanService } = await getService();

    // Set default token if needed
    if (!selectedToken) {
      const defaultToken = depositTokens[0];

      history.push({
        pathname: location.pathname,
        search: stringify({
          tokenAddress: defaultToken.tokenAddress,
        }),
      });
    }

    // Get records
    await depositService.getDepositRecordsByAccount(defaultAccount);
    await loanService.getLoanRecordsByAccount(defaultAccount);
  });

  // State

  // Computed

  const { tokenAddress, recordId } = parseQuery(location.search);

  const selectedToken = depositTokens.find(
    token => token.tokenAddress === tokenAddress,
  );

  const selectedRecord = (depositRecords as IRecord[])
    .concat(loanRecords)
    .find(record => record.recordId === recordId);

  const depositColumns = ['token', 'term', 'amount', 'matured_at'];

  const loanColumns = [
    'borrow',
    'collateral',
    'collateral_ratio',
    'expired_at',
  ];

  // Callback
  const onRecordTypeChange = useCallback(
    (type: RecordType) => {
      history.push({
        pathname: `/records/${type}`,
        search: stringify({
          tokenAddress,
        }),
      });
    },
    [RecordType, tokenAddress],
  );

  const onCurrentTokenChange = useCallback(
    (token: IDropdownOption) => {
      history.push({
        pathname: location.pathname,
        search: stringify({
          ...parseQuery(location.search),
          tokenAddress: token.key,
        }),
      });
    },
    [history],
  );

  const onRecordSelected = useCallback(
    (record: IRecord) =>
      history.push({
        pathname: location.pathname,
        search: stringify({
          ...parseQuery(location.search),
          recordId: record.recordId,
        }),
      }),
    [history],
  );

  const renderRow = useCallback(
    (record: IRecord) => (
      <RecordItem
        record={record}
        selectedRecordId={recordId}
        onRecordSelected={onRecordSelected}
      />
    ),
    [onRecordSelected],
  );

  return (
    <div className="detail-page">
      <StyledCard>
        <Radio<RecordType>
          name="recordType"
          onChange={onRecordTypeChange}
          options={recordTypeOptions}
          selectedOption={selectedOption}
        />
      </StyledCard>
      <StyledCard>
        <StyledRow>
          <StyledListWrapper>
            <StyledDropDown
              options={depositTokens.map(token => ({
                text: token.tokenSymbol,
                key: token.tokenAddress,
              }))}
              onSelected={onCurrentTokenChange}
            >
              {selectedToken ? selectedToken.tokenSymbol : ''}
            </StyledDropDown>
            {selectedOption && (
              <RecordList
                columns={
                  selectedOption.value === RecordType.Deposit
                    ? depositColumns
                    : loanColumns
                }
                records={
                  selectedOption && selectedOption.value === RecordType.Deposit
                    ? depositRecords
                    : loanRecords
                }
                renderRow={renderRow}
              />
            )}
          </StyledListWrapper>
          <Cell scale={1.5}>
            {recordId && selectedRecord && (
              <RecordDetail
                accountAddress={defaultAccount}
                record={selectedRecord}
                transactionsForRecord={transactions.filter(
                  tx => tx.recordId === recordId,
                )}
                tokens={depositTokens}
                isUserActionsLocked={isUserActionsLocked}
              />
            )}
          </Cell>
        </StyledRow>
      </StyledCard>
    </div>
  );
};
export default withTranslation()(withRouter(RecordPage));
