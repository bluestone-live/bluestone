import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { RecordStore } from '../stores';
import Card from '../components/common/Card';
import Input from '../components/html/Input';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import Button from '../components/html/Button';
import Form from '../components/html/Form';
import { RecordType } from '../constants/Record';
import dayjs from 'dayjs';
import { convertDecimalToWei } from '../utils/BigNumber';
import { stringify } from 'querystring';

interface IProps
  extends WithTranslation,
    RouteComponentProps<{ recordAddress: string }> {
  recordStore?: RecordStore;
}

interface IState {
  amount: number;
  loading: boolean;
}

@inject('recordStore')
@observer
class RepayForm extends React.Component<IProps, IState> {
  state = {
    amount: 0,
    loading: false,
  };

  async componentDidMount() {
    const { recordStore, match } = this.props;
    await recordStore!.updateLoanRecordByAddress(match.params.recordAddress);
    this.setState({
      loading: true,
    });
  }

  onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({
      amount: Number.parseFloat(e.currentTarget.value),
    });

  onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { recordStore, match, history } = this.props;
    const { amount } = this.state;

    await recordStore!.repay(
      match.params.recordAddress,
      convertDecimalToWei(amount),
    );
    const record = recordStore!.getLoanRecordByAddress(
      match.params.recordAddress,
    )!;

    history.push({
      pathname: '/records/loan',
      search: stringify({
        tokenSymbol: record.loanToken.symbol,
        recordAddress: record.recordAddress,
      }),
    });
  };

  render() {
    const { t, recordStore, match } = this.props;
    const record = recordStore!.getLoanRecordByAddress(
      match.params.recordAddress,
    );

    return record && record.type === RecordType.Loan ? (
      <Card>
        <Form onSubmit={this.onSubmit}>
          <Form.Item>
            <label htmlFor="amount">{t('repay')}</label>
            <Input
              id="amount"
              type="number"
              step={1e-18}
              min={1e-18}
              max={record.remainingDebt}
              onChange={this.onAmountChange}
            />
          </Form.Item>
          <Form.Item>
            <label>{t('remaining')}</label>
            <Input type="text" disabled value={`${record.remainingDebt}`} />
          </Form.Item>
          <Form.Item>
            <label>{t('interest')}</label>
            <Input
              type="text"
              disabled
              value={`${record.interest} ${record.loanToken.symbol}`}
            />
          </Form.Item>
          <Form.Item>
            <label>{t('expire_date')}</label>
            <Input
              type="text"
              disabled
              value={dayjs(record.createdAt)
                .add(record.term.value, 'day')
                .format('YYYY-MM-DD')}
            />
          </Form.Item>
          <Form.Item>
            <Button>{t('submit')}</Button>
          </Form.Item>
        </Form>
      </Card>
    ) : (
      <Card>{t('recordAddress_is_invalid')}</Card>
    );
  }
}

export default withTranslation()(withRouter(RepayForm));
