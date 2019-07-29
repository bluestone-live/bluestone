import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { RecordStore } from '../stores';
import Card from '../components/common/Card';
import Input from '../components/html/Input';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import Button from '../components/html/Button';
import Form from '../components/html/Form';
import { RecordType, ILoanRecord } from '../constants/Record';
import { toJS } from 'mobx';
import dayjs from 'dayjs';
import { convertDecimalToWei } from '../utils/BigNumber';

interface IProps
  extends WithTranslation,
    RouteComponentProps<{ recordAddress: string }> {
  recordStore: RecordStore;
}

interface IState {
  amount: number;
}

@inject('recordStore')
@observer
class AddCollateralPage extends React.Component<IProps, IState> {
  state = {
    amount: 0,
  };

  componentDidMount() {
    const { recordStore, match } = this.props;
    recordStore.updateLoanRecord(match.params.recordAddress);
  }

  onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({
      amount: Number.parseFloat(e.currentTarget.value),
    });

  onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { recordStore, match, history } = this.props;
    const { amount } = this.state;

    await recordStore.addCollateral(
      match.params.recordAddress,
      convertDecimalToWei(amount),
      convertDecimalToWei(0), // TODO request free collateral will add later
    );
    await recordStore.updateLoanRecord(match.params.recordAddress);
    const record = recordStore.getRecordByAddress(
      match.params.recordAddress,
    ) as ILoanRecord;

    history.push(`/records?tokenSymbol=${record.loanToken.symbol}`);
  };

  getCollateralRatio = (record: ILoanRecord) => {
    if (!record.loanToken.price || !record.collateralToken.price) {
      return 'calculate error';
    }
    return (
      (record.collateralAmount * (record.collateralToken.price || 0)) /
      (record.loanToken.price || 1) /
      record.loanAmount
    );
  };

  render() {
    const { t, recordStore, match } = this.props;
    const record = toJS(
      recordStore.records.find(
        tx => tx.recordAddress === match.params.recordAddress,
      ),
    ) as ILoanRecord;

    return record && record.type === RecordType.Loan ? (
      <Card>
        <Form onSubmit={this.onSubmit}>
          <Form.Item>
            <label>{t('current_collateral')}</label>
            <Input
              type="text"
              disabled
              value={`${record.collateralAmount} ${record.collateralToken.symbol}`}
            />
          </Form.Item>
          <Form.Item>
            <label htmlFor="amount">{t('add_collateral_amount')}</label>
            <Input
              id="amount"
              type="number"
              step={1e-8}
              onChange={this.onAmountChange}
            />
          </Form.Item>
          <Form.Item>
            <label>{t('collateral_ratio')}</label>
            <Input
              type="text"
              disabled
              value={this.getCollateralRatio(record)}
            />
          </Form.Item>
          <Form.Item>
            <label>{t('expired_at')}</label>
            <Input
              type="text"
              disabled
              value={dayjs(record.createdAt)
                .add(record.term.value, 'day')
                .format('YYYY-MM-DD')}
            />
          </Form.Item>
          <Form.Item>
            <label />
            <Button primary>{t('submit')}</Button>
          </Form.Item>
        </Form>
      </Card>
    ) : (
      <Card>{t('recordAddress_is_invalid')}</Card>
    );
  }
}

export default withTranslation()(withRouter(AddCollateralPage));
