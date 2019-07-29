import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { ILoanRecord, RecordStatus } from '../../constants/Record';
import { Row, Cell } from '../../components/common/Layout';
import Button from '../../components/html/Button';
import Anchor from '../../components/html/Anchor';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';
import { ThemedProps } from '../../styles/themes';
import dayjs from 'dayjs';

interface IProps extends WithTranslation, RouteComponentProps {
  loanRecord: ILoanRecord;
}

const StyledItemCell = styled(Cell)`
  height: 50px;
  text-align: center;
  font-size: ${(props: ThemedProps) => props.theme.fontSize.medium};
  padding: ${(props: ThemedProps) => props.theme.gap.small};
`;

class LoanRecordItem extends React.Component<IProps> {
  goTo = (path: string) => () => this.props.history.push(path);

  getActions = () => {
    const { loanRecord, t } = this.props;
    if (loanRecord.status === RecordStatus.LoanLiquidating) {
      return (
        <Button disabled fullWidth>
          {t('record_liquidating')}
        </Button>
      );
    }
    if (loanRecord.status === RecordStatus.LoanClosed) {
      return (
        <Button.Group>
          <Button
            onClick={this.goTo(
              `loan/collateral/withdraw/${loanRecord.recordAddress}`,
            )}
          >
            {t('withdraw_collateral')}
          </Button>
        </Button.Group>
      );
    }
    return (
      <Button.Group>
        <Button
          onClick={this.goTo(
            `/loan/collateral/add/${loanRecord.recordAddress}`,
          )}
        >
          {t('add_collateral')}
        </Button>
        <Button
          primary
          onClick={this.goTo(`/loan/repay/${loanRecord.recordAddress}`)}
        >
          {t('repay')}
        </Button>
      </Button.Group>
    );
  };

  render() {
    const { loanRecord } = this.props;

    return (
      <div className="deposit-item">
        <Row>
          <StyledItemCell>
            <Anchor to="/action-logs">
              collateral: {loanRecord.collateralToken.symbol}; loan:
              {loanRecord.loanToken.symbol}
            </Anchor>
          </StyledItemCell>
          <StyledItemCell>{loanRecord.term.text}</StyledItemCell>
          <StyledItemCell>{loanRecord.loanAmount}</StyledItemCell>
          <StyledItemCell>
            {dayjs(loanRecord.createdAt)
              .add(loanRecord.term.value, 'day')
              .format('YYYY-MM-DD')}
          </StyledItemCell>
          <StyledItemCell>{this.getActions()}</StyledItemCell>
        </Row>
      </div>
    );
  }
}

export default withTranslation()(withRouter(LoanRecordItem));
