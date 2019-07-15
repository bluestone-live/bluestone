import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  ILoanTransaction,
  TransactionStatus,
} from '../../constants/Transaction';
import { Row, Cell } from '../../components/common/Layout';
import Button from '../../components/html/Button';
import Anchor from '../../components/html/Anchor';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';
import { ThemedProps } from '../../styles/themes';

interface IProps extends WithTranslation, RouteComponentProps {
  loanTransaction: ILoanTransaction;
}

const StyledItemCell = styled(Cell)`
  height: 50px;
  text-align: center;
  font-size: ${(props: ThemedProps) => props.theme.fontSize.medium};
  padding: ${(props: ThemedProps) => props.theme.gap.small};
`;

class LoanTransactionItem extends React.Component<IProps> {
  goTo = (path: string) => () => this.props.history.push(path);

  getActions = () => {
    const { loanTransaction, t } = this.props;
    if (loanTransaction.status === TransactionStatus.LoanLiquidating) {
      return (
        <Button disabled fullWidth>
          {t('transaction_liquidating')}
        </Button>
      );
    }
    if (loanTransaction.status === TransactionStatus.LoanClosed) {
      return (
        <Button.Group>
          <Button
            onClick={this.goTo(
              `loan/collateral/withdraw/${loanTransaction.transactionAddress}`,
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
            `/loan/collateral/add/${loanTransaction.transactionAddress}`,
          )}
        >
          {t('add_collateral')}
        </Button>
        <Button
          primary
          onClick={this.goTo(
            `/loan/repay/${loanTransaction.transactionAddress}`,
          )}
        >
          {t('repay')}
        </Button>
      </Button.Group>
    );
  };

  render() {
    const { t, loanTransaction } = this.props;

    return (
      <div className="deposit-item">
        <Row>
          <StyledItemCell>
            <Anchor to="/action-logs">
              collateral: {loanTransaction.collateralToken.symbol}; loan:
              {loanTransaction.loanToken.symbol}
            </Anchor>
          </StyledItemCell>
          <StyledItemCell>{t('loan')}</StyledItemCell>
          <StyledItemCell>{loanTransaction.loanAmount}</StyledItemCell>
          <StyledItemCell>
            {t(TransactionStatus[loanTransaction.status])}
          </StyledItemCell>
          <StyledItemCell>{this.getActions()}</StyledItemCell>
        </Row>
      </div>
    );
  }
}

export default withTranslation()(withRouter(LoanTransactionItem));
