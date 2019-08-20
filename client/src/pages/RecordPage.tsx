import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { withRouter, RouteComponentProps } from 'react-router';
import {
  RecordStore,
  TransactionStore,
  TokenStore,
  AccountStore,
} from '../stores';
import Card from '../components/common/Card';
import Radio from '../components/common/Radio';
import styled from 'styled-components';
import { ThemedProps } from '../styles/themes';
import DepositDetailPanel from '../containers/DepositDetailPanel';
import { toJS } from 'mobx';
import parseQuery from '../utils/parseQuery';
import { stringify } from 'querystring';
import { IDropdownOption } from '../components/common/Dropdown';
import LoanDetailPanel from '../containers/LoanDetailPanel';
import { convertWeiToDecimal, convertDecimalToWei } from '../utils/BigNumber';
import Button from '../components/html/Button';

interface IProps
  extends WithTranslation,
    RouteComponentProps<{ recordType: string }> {
  recordStore: RecordStore;
  transactionStore: TransactionStore;
  tokenStore: TokenStore;
  accountStore: AccountStore;
}

interface IState {
  recordType: string;
}

const StyledCard = styled(Card)`
  margin-bottom: ${(props: ThemedProps) => props.theme.gap.medium};
  min-height: 50px;
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledBox = styled.div`
  width: 100px;
  flex: 1;
  text-align: right;
`;

const StyledButton = styled(Button)`
  margin-left: ${(props: ThemedProps) => props.theme.gap.medium};
`;

@inject('recordStore', 'transactionStore', 'tokenStore', 'accountStore')
@observer
class RecordPage extends React.Component<IProps, IState> {
  componentDidMount() {
    this.setDefaultToken();
    this.getDetailRecords();
    this.getFreedCollateral();
  }

  componentDidUpdate() {
    this.setDefaultToken();
    this.getDetailRecords();
    this.getFreedCollateral();
  }

  getDetailRecords = async () => {
    const {
      match: {
        params: { recordType },
      },
      recordStore,
    } = this.props;
    if (recordType === 'loan') {
      return recordStore.getLoanRecords();
    } else if (recordType === 'deposit') {
      return recordStore.getDepositRecords();
    }
  };

  getFreedCollateral = () => {
    const { tokenStore, accountStore } = this.props;
    const { currentToken } = parseQuery(location.search);

    const selectedToken = tokenStore.getTokenByAddress(currentToken);

    if (!selectedToken) {
      return;
    }

    return accountStore.getFreedCollateral(selectedToken);
  };

  setDefaultToken = () => {
    const { location, history, tokenStore } = this.props;

    const { currentToken } = parseQuery(location.search);

    const selectedToken = tokenStore.getTokenByAddress(currentToken);

    if (!selectedToken) {
      const defaultToken = tokenStore.validTokens[0];

      history.push({
        pathname: location.pathname,
        search: stringify({
          currentToken: defaultToken.address,
        }),
      });
    }
  };

  recordTypeChangeHandler = (recordType: string) => {
    const { location, history } = this.props;

    const { currentToken } = parseQuery(location.search);

    history.push({
      pathname: `/records/${recordType}`,
      search: stringify({
        currentToken,
      }),
    });
  };

  recordTypeOptions = [
    {
      text: this.props.t('deposit'),
      value: 'deposit',
    },
    {
      text: this.props.t('loan'),
      value: 'loan',
    },
  ];

  onRecordSelected = (recordAddress: string) => {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: stringify({
        ...parseQuery(location.search),
        recordAddress,
      }),
    });
  };

  onCurrentTokenChange = (token: IDropdownOption) => {
    const { history, location } = this.props;

    history.push({
      pathname: location.pathname,
      search: stringify({
        ...parseQuery(location.search),
        currentToken: token.key,
      }),
    });
  };

  showDetailPanel = () => {
    const {
      match: {
        params: { recordType },
      },
      location: { search },
      recordStore,
      tokenStore,
    } = this.props;

    const { currentToken, recordAddress } = parseQuery(search);

    if (recordType === 'deposit') {
      return (
        <DepositDetailPanel
          onRecordSelected={this.onRecordSelected}
          selectedRecordAddress={recordAddress}
          recordStore={recordStore}
          depositRecords={toJS(recordStore.depositRecords)}
          validTokens={toJS(tokenStore.validTokens)}
          currentToken={currentToken}
          onCurrentTokenChange={this.onCurrentTokenChange}
        />
      );
    }
    return (
      <LoanDetailPanel
        onRecordSelected={this.onRecordSelected}
        selectedRecordAddress={recordAddress}
        recordStore={recordStore}
        loanRecords={toJS(recordStore.loanRecords)}
        validTokens={toJS(tokenStore.validTokens)}
        currentToken={currentToken}
        onCurrentTokenChange={this.onCurrentTokenChange}
      />
    );
  };

  goTo = (path: string) => () => {
    this.props.history.push(path);
  };

  render() {
    const {
      match: {
        params: { recordType },
      },
      location,
      accountStore,
      t,
    } = this.props;
    const selectedOption = this.recordTypeOptions.find(
      option => option.value === recordType,
    );

    const { currentToken } = parseQuery(location.search);
    const freedCollateral =
      accountStore.getFreedCollateralByAddress(currentToken) ||
      convertDecimalToWei(0);

    if (!currentToken) {
      return null;
    }

    return (
      <div className="detail-page">
        <StyledCard>
          <Radio<string>
            name="recordType"
            onChange={this.recordTypeChangeHandler}
            options={this.recordTypeOptions}
            selectedOption={selectedOption}
          />
          {recordType === 'loan' && (
            <StyledBox>
              {t('freed_collateral')}:{convertWeiToDecimal(freedCollateral)}
              <StyledButton onClick={this.goTo(`/withdraw/${currentToken}`)}>
                {t('withdraw')}
              </StyledButton>
            </StyledBox>
          )}
        </StyledCard>
        <StyledCard>{this.showDetailPanel()}</StyledCard>
      </div>
    );
  }
}

export default withTranslation()(withRouter(RecordPage));
