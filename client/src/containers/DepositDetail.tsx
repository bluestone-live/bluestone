import * as React from 'react';
import { IDepositRecord, RecordStatus } from '../constants/Record';
import { WithTranslation, withTranslation } from 'react-i18next';
import Form from '../components/html/Form';
import TextBox from '../components/common/TextBox';
import Button from '../components/html/Button';
import { RecordStore, ConfigurationStore } from '../stores';
import { observer } from 'mobx-react';
import { ITransaction } from '../constants/Transaction';
import TransactionList from './TransactionList';

interface IProps extends WithTranslation {
  configurationStore: ConfigurationStore;
  depositRecord: IDepositRecord;
  recordStore: RecordStore;
  transactionsForRecord?: ITransaction[];
}

interface IState {
  loading: boolean;
}

@observer
class DepositDetail extends React.Component<IProps, IState> {
  state = {
    loading: false,
  };

  setLoading = (loading: boolean) =>
    this.setState({
      loading,
    });

  withdraw = async () => {
    const { depositRecord, recordStore } = this.props;
    this.setLoading(true);
    await recordStore.withdrawDeposit(depositRecord.recordAddress);
    await recordStore.updateDepositRecordByAddress(depositRecord.recordAddress);
    this.setLoading(false);
  };

  render() {
    const {
      t,
      depositRecord,
      transactionsForRecord,
      configurationStore,
    } = this.props;
    const { loading } = this.state;

    return (
      <div className="deposit-detail">
        <Form.Item>
          <label htmlFor="amount">{t('deposit_amount')}</label>
          <TextBox>{depositRecord.depositAmount}</TextBox>
        </Form.Item>
        <Form.Item>
          <label>{t('interest_earned')}</label>
          <TextBox>{depositRecord.interestEarned}</TextBox>
        </Form.Item>
        {depositRecord.status === RecordStatus.DepositMatured && (
          <Form.Item>
            <Button.Group>
              <Button
                primary
                onClick={this.withdraw}
                disabled={configurationStore!.isUserActionsLocked}
                loading={loading}
              >
                {t('withdraw')}
              </Button>
            </Button.Group>
          </Form.Item>
        )}
        {transactionsForRecord && (
          <TransactionList
            record={depositRecord}
            transactions={transactionsForRecord}
          />
        )}
      </div>
    );
  }
}

export default withTranslation()(DepositDetail);
