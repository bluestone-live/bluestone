import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { IDepositRecord, RecordStatus } from '../../constants/Record';
import { Row, Cell } from '../../components/common/Layout';
import Button from '../../components/html/Button';
import Anchor from '../../components/html/Anchor';
import { RecordStore } from '../../stores';
import styled from 'styled-components';
import { ThemedProps } from '../../styles/themes';
import dayjs from 'dayjs';

interface IProps extends WithTranslation {
  depositRecord: IDepositRecord;
  recordStore: RecordStore;
}

const StyledItemCell = styled(Cell)`
  height: 50px;
  text-align: center;
  font-size: ${(props: ThemedProps) => props.theme.fontSize.medium};
  padding: ${(props: ThemedProps) => props.theme.gap.small};
`;

class DepositRecordItem extends React.Component<IProps> {
  getActions = () => {
    const { depositRecord, t } = this.props;
    if (depositRecord.status === RecordStatus.DepositMatured) {
      return (
        <Button fullWidth onClick={this.withdrawDeposit(depositRecord)}>
          {t('withdraw')}
        </Button>
      );
    }
    if (depositRecord.status === RecordStatus.DepositRecurring) {
      return (
        <Button fullWidth onClick={this.toggleRenewal(depositRecord, false)}>
          {t('disable_auto_renewal')}
        </Button>
      );
    }
    return (
      <Button onClick={this.toggleRenewal(depositRecord, true)}>
        {t('enable_auto_renewal')}
      </Button>
    );
  };

  withdrawDeposit = (depositRecord: IDepositRecord) => async () => {
    return this.props.recordStore.withdrawDeposit(depositRecord.recordAddress);
  };

  toggleRenewal = (
    depositRecord: IDepositRecord,
    autoRenewal: boolean,
  ) => async () => {
    await this.props.recordStore.toggleRenewal(
      depositRecord.recordAddress,
      autoRenewal,
    );
    return this.props.recordStore.updateDeposit(depositRecord.recordAddress);
  };

  render() {
    const { depositRecord } = this.props;

    return (
      <div className="deposit-item">
        <Row>
          <StyledItemCell>
            <Anchor to="/action-logs">{depositRecord.token.symbol}</Anchor>
          </StyledItemCell>
          <StyledItemCell>{depositRecord.term.text}</StyledItemCell>
          <StyledItemCell>{depositRecord.depositAmount}</StyledItemCell>
          <StyledItemCell>
            {dayjs(depositRecord.maturedAt).format('YYYY-MM-DD')}
          </StyledItemCell>
          <StyledItemCell>{this.getActions()}</StyledItemCell>
        </Row>
      </div>
    );
  }
}

export default withTranslation()(DepositRecordItem);
