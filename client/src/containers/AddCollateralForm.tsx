import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { RecordStore, ConfigurationStore, AccountStore } from '../stores';
import Card from '../components/common/Card';
import Input from '../components/html/Input';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import Button from '../components/html/Button';
import Form from '../components/html/Form';
import { RecordType, ILoanRecord } from '../constants/Record';
import { toJS } from 'mobx';
import dayjs from 'dayjs';
import {
  convertDecimalToWei,
  convertWeiToDecimal,
  BigNumber,
} from '../utils/BigNumber';
import { stringify } from 'querystring';
import Toggle from '../components/common/Toggle';
import { Row, Cell } from '../components/common/Layout';
import TextBox from '../components/common/TextBox';

interface IProps
  extends WithTranslation,
    RouteComponentProps<{ recordAddress: string }> {
  recordStore?: RecordStore;
  configurationStore?: ConfigurationStore;
  accountStore?: AccountStore;
}

interface IState {
  amount: number;
  useFreedCollateral: boolean;
  formSubmitting: boolean;
}

@inject('accountStore', 'recordStore', 'configurationStore')
@observer
class AddCollateralForm extends React.Component<IProps, IState> {
  state = {
    amount: 0,
    useFreedCollateral: false,
    formSubmitting: false,
  };

  async componentDidMount() {
    const { recordStore, match } = this.props;
    await recordStore!.updateLoanRecordByAddress(match.params.recordAddress);
    await this.getFreedCollateral();
  }

  getFreedCollateral = () => {
    const { accountStore, recordStore, match } = this.props;
    const record = recordStore!.getLoanRecordByAddress(
      match.params.recordAddress,
    )!;

    return accountStore!.getFreedCollateral(record.collateralToken);
  };

  onAmountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({
      amount: Number.parseFloat(e.currentTarget.value),
    });

  onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { recordStore, match, history } = this.props;
    const { amount, useFreedCollateral } = this.state;

    this.setState({
      formSubmitting: true,
    });

    await recordStore!.addCollateral(
      match.params.recordAddress,
      convertDecimalToWei(amount),
      useFreedCollateral,
    );
    await recordStore!.updateLoanRecordByAddress(match.params.recordAddress);
    const record = recordStore!.getLoanRecordByAddress(
      match.params.recordAddress,
    )!;

    this.setState({
      formSubmitting: false,
    });

    history.push({
      pathname: '/records/loan',
      search: stringify({
        tokenSymbol: record.loanToken.symbol,
        recordAddress: record.recordAddress,
      }),
    });
  };

  getCollateralRatio = (record: ILoanRecord) => {
    if (!record.loanToken.price || !record.collateralToken.price) {
      return 'calculate error';
    }
    return (
      ((Number.parseFloat(record.collateralAmount) *
        (Number.parseFloat(convertWeiToDecimal(record.collateralToken.price)) ||
          0)) /
        (Number.parseFloat(convertWeiToDecimal(record.loanToken.price)) || 1) /
        Number.parseFloat(record.loanAmount)) *
      100
    ).toFixed(2);
  };

  onUseFreedCollateralChange = (useFreedCollateral: boolean) =>
    this.setState({
      useFreedCollateral,
    });

  renderFreedCollateralItems = (freedCollateral: BigNumber | undefined) => {
    const { t } = this.props;

    return (
      <div className="freed-collateral">
        <Form.Item key="use_freed_collateral">
          <Row>
            <Cell>
              <label>{t('use_freed_collateral')}</label>
            </Cell>
            <Cell scale={3}>
              <Toggle
                defaultValue={this.state.useFreedCollateral}
                onChange={this.onUseFreedCollateralChange}
              />
            </Cell>
          </Row>
        </Form.Item>
        <Form.Item key="freed_collateral_amount">
          <Row>
            <Cell>
              <label>{t('freed_collateral_amount')}</label>
            </Cell>
            <Cell scale={3}>
              <TextBox>{convertWeiToDecimal(freedCollateral)}</TextBox>
            </Cell>
          </Row>
        </Form.Item>
      </div>
    );
  };

  render() {
    const {
      t,
      accountStore,
      recordStore,
      configurationStore,
      match,
    } = this.props;
    const record = toJS(
      recordStore!.loanRecords.find(
        tx => tx.recordAddress === match.params.recordAddress,
      ),
    );

    if (!record || record.type !== RecordType.Loan) {
      return null;
    }

    const freedCollateral = accountStore!.getFreedCollateralByAddress(
      record.collateralToken.address,
    );

    const couldUseFreedCollateral = freedCollateral
      ? Number.parseFloat(convertWeiToDecimal(freedCollateral)) !== 0
      : false;

    return (
      <Card>
        <Form onSubmit={this.onSubmit}>
          <Form.Item>
            <Row>
              <Cell>
                <label>{t('current_collateral')}</label>
              </Cell>
              <Cell scale={3}>
                <Input
                  type="text"
                  disabled
                  value={record.collateralAmount}
                  suffix={record.collateralToken.symbol}
                />
              </Cell>
            </Row>
          </Form.Item>
          <Form.Item>
            <Row>
              <Cell>
                <label htmlFor="amount">{t('add_collateral_amount')}</label>
              </Cell>
              <Cell scale={3}>
                <Input
                  id="amount"
                  type="number"
                  step={1e-18}
                  min={1e-18}
                  onChange={this.onAmountChange}
                  suffix={record.collateralToken.symbol}
                />
              </Cell>
            </Row>
          </Form.Item>
          <Form.Item>
            <Row>
              <Cell>
                <label>{t('collateral_ratio')}</label>
              </Cell>
              <Cell scale={3}>
                <TextBox>{`${this.getCollateralRatio(record)} %`}</TextBox>
              </Cell>
            </Row>
          </Form.Item>
          <Form.Item>
            <Row>
              <Cell>
                <label>{t('expired_at')}</label>
              </Cell>
              <Cell scale={3}>
                <Input
                  type="text"
                  disabled
                  value={dayjs(record.createdAt)
                    .add(record.term.value, 'day')
                    .format('YYYY-MM-DD')}
                />
              </Cell>
            </Row>
          </Form.Item>
          {couldUseFreedCollateral &&
            this.renderFreedCollateralItems(freedCollateral)}
          <Form.Item>
            <Row>
              <Cell>
                <label />
              </Cell>
              <Cell scale={3}>
                <Button
                  primary
                  disabled={configurationStore!.isUserActionsLocked}
                  loading={this.state.formSubmitting}
                >
                  {t('add_collateral')}
                </Button>
              </Cell>
            </Row>
          </Form.Item>
        </Form>
      </Card>
    );
  }
}

export default withTranslation()(withRouter(AddCollateralForm));
