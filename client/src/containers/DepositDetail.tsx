import * as React from 'react';
import { IDepositRecord } from '../constants/Record';
import { Row, Cell } from '../components/common/Layout';
import { WithTranslation, withTranslation } from 'react-i18next';
import Form from '../components/html/Form';
import TextBox from '../components/common/TextBox';
import Button from '../components/html/Button';
import { RecordStore } from '../stores';
import { observer } from 'mobx-react';
import { ITransaction } from '../constants/Transaction';
import TransactionList from './TransactionList';

interface IProps extends WithTranslation {
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

  toggleRenewal = async () => {
    const { depositRecord, recordStore } = this.props;
    this.setLoading(true);
    await recordStore.toggleRenewal(
      depositRecord.recordAddress,
      !depositRecord.isRecurring,
    );
    await recordStore.updateDepositRecordByAddress(depositRecord.recordAddress);
    this.setLoading(false);
  };

  render() {
    const { t, depositRecord, transactionsForRecord } = this.props;
    const { loading } = this.state;

    return (
      <div className="deposit-detail">
        <Form.Item>
          <Row>
            <Cell>
              <label htmlFor="amount">{t('deposit_amount')}</label>
            </Cell>
            <Cell scale={4}>
              <TextBox>{depositRecord.depositAmount}</TextBox>
            </Cell>
          </Row>
        </Form.Item>
        <Form.Item>
          <Cell>
            <label>{t('select_term')}</label>
          </Cell>
          <Cell scale={4}>
            <TextBox>{depositRecord.term.text}</TextBox>
          </Cell>
        </Form.Item>
        <Form.Item>
          <Cell>
            <label>{t('actual_income')}</label>
          </Cell>
          <Cell scale={4}>
            <TextBox>
              {
                // TODO: depends on the contract refactor
              }
            </TextBox>
          </Cell>
        </Form.Item>
        <Form.Item>
          <Cell>
            <label>{t('is_auto_renewal')}</label>
          </Cell>
          <Cell scale={4}>
            <TextBox>{depositRecord.isRecurring.toString()}</TextBox>
          </Cell>
        </Form.Item>
        <Form.Item>
          <Button.Group>
            <Button primary onClick={this.withdraw} disabled={loading}>
              {t('withdraw')}
            </Button>
            <Button onClick={this.toggleRenewal} disabled={loading}>
              {t('toggle_renewal')}
            </Button>
          </Button.Group>
        </Form.Item>
        {transactionsForRecord ? (
          <TransactionList transactions={transactionsForRecord} />
        ) : null}
      </div>
    );
  }
}

export default withTranslation()(DepositDetail);
