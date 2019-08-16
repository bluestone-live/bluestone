import * as React from 'react';
import { IDepositRecord } from '../constants/Record';
import { Row, Cell } from '../components/common/Layout';
import { WithTranslation, withTranslation } from 'react-i18next';
import DepositRecordList from './DepositRecordList';
import { RecordStore, TransactionStore } from '../stores';
import { RouteComponentProps, withRouter } from 'react-router';
import parseQuery from '../utils/parseQuery';
import DepositDetail from './DepositDetail';
import styled from 'styled-components';
import { ThemedProps } from '../styles/themes';
import DropDown, { IDropdownOption } from '../components/common/Dropdown';
import { IToken } from '../constants/Token';
import { observer, inject } from 'mobx-react';

interface IProps extends WithTranslation, RouteComponentProps {
  transactionStore?: TransactionStore;
  depositRecords: IDepositRecord[];
  currentToken: string;
  validTokens: IToken[];
  onCurrentTokenChange: (option: IDropdownOption) => void;
  recordStore: RecordStore;
  onRecordSelected: (recordAddress: string) => void;
  selectedRecordAddress?: string;
}

const StyledRow = styled(Row)`
  width: 100%;
`;

const StyledListWrapper = styled(Cell)`
  border-right: 1px solid
    ${(props: ThemedProps) => props.theme.borderColor.secondary};
`;

const StyledDropDown = styled(DropDown)`
  border-radius: 0;
  border-width: 0 0 1px 0;
`;

@inject('transactionStore')
@observer
class DepositDetailPanel extends React.Component<IProps> {
  componentDidMount() {
    this.props.transactionStore!.getDepositTransactions();
  }

  render() {
    const {
      location: { search },
      recordStore,
      validTokens,
      currentToken,
      transactionStore,
    } = this.props;

    const { recordAddress } = parseQuery(search);

    const depositRecord = recordStore.getDepositRecordByAddress(recordAddress);

    const selectedToken = validTokens.find(
      token => token.address === currentToken,
    )!;

    return (
      <StyledRow>
        <StyledListWrapper>
          <StyledDropDown
            options={validTokens.map(token => ({
              text: token.symbol,
              key: token.address,
            }))}
            onSelected={this.props.onCurrentTokenChange}
          >
            {selectedToken ? selectedToken.symbol : ''}
          </StyledDropDown>
          <DepositRecordList
            depositRecords={recordStore.depositRecords.filter(
              record => record.token.address === selectedToken.address,
            )}
            currentToken={currentToken}
            onRecordSelected={this.props.onRecordSelected}
            selectedRecordAddress={this.props.selectedRecordAddress}
          />
        </StyledListWrapper>
        <Cell scale={1.5}>
          {recordAddress && depositRecord && (
            <DepositDetail
              recordStore={recordStore}
              depositRecord={depositRecord}
              transactionsForRecord={transactionStore!.getDepositTransactionByRecordAddress(
                depositRecord.recordAddress,
              )}
            />
          )}
        </Cell>
      </StyledRow>
    );
  }
}

export default withTranslation()(withRouter(DepositDetailPanel));
