import * as React from 'react';
import { ILoanRecord } from '../constants/Record';
import { Row, Cell } from '../components/common/Layout';
import { WithTranslation, withTranslation } from 'react-i18next';
import LoanRecordList from './LoanRecordList';
import { RecordStore, TransactionStore, ConfigurationStore } from '../stores';
import { RouteComponentProps, withRouter } from 'react-router';
import parseQuery from '../utils/parseQuery';
import LoanDetail from './LoanDetail';
import styled from 'styled-components';
import { ThemedProps } from '../styles/themes';
import DropDown, { IDropdownOption } from '../components/common/Dropdown';
import { IToken } from '../constants/Token';
import { inject, observer } from 'mobx-react';

interface IProps extends WithTranslation, RouteComponentProps {
  transactionStore?: TransactionStore;
  configurationStore?: ConfigurationStore;
  loanRecords: ILoanRecord[];
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
    ${(props: ThemedProps) => props.theme.borderColor.primary};
`;

const StyledDropDown = styled(DropDown)`
  border-radius: 0;
  border-width: 0 0 1px 0;
`;

@inject('transactionStore', 'configurationStore')
@observer
class LoanDetailPanel extends React.Component<IProps> {
  componentDidMount() {
    this.props.transactionStore!.getLoanTransactions();
  }

  render() {
    const {
      location: { search },
      recordStore,
      validTokens,
      currentToken,
      transactionStore,
      configurationStore,
    } = this.props;

    const { recordAddress } = parseQuery(search);

    const loanRecord = recordStore.getLoanRecordByAddress(recordAddress);

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
          <LoanRecordList
            loanRecords={recordStore.loanRecords.filter(
              record => record.loanToken.address === selectedToken.address,
            )}
            currentToken={currentToken}
            onRecordSelected={this.props.onRecordSelected}
            selectedRecordAddress={this.props.selectedRecordAddress}
          />
        </StyledListWrapper>
        <Cell scale={1.5}>
          {recordAddress && loanRecord && (
            <LoanDetail
              isUserActionsLocked={configurationStore!.isUserActionsLocked}
              loanRecord={loanRecord}
              transactionsForRecord={transactionStore!.getLoanTransactionByRecordAddress(
                loanRecord.recordAddress,
              )}
            />
          )}
        </Cell>
      </StyledRow>
    );
  }
}

export default withTranslation()(withRouter(LoanDetailPanel));
