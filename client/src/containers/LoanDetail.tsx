import * as React from 'react';
import Form from '../components/html/Form';
import TextBox from '../components/common/TextBox';
import { RouteComponentProps, withRouter } from 'react-router';
import { ILoanRecord, RecordStatus } from '../constants/Record';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  calculateRate,
  RatePeriod,
} from '../utils/interestRateCalculateHelper';
import Button from '../components/html/Button';
import { ITransaction } from '../constants/Transaction';
import TransactionList from './TransactionList';

interface IProps extends WithTranslation, RouteComponentProps {
  loanRecord: ILoanRecord;
  transactionsForRecord?: ITransaction[];
}

const goTo = (path: string, props: IProps) => () => props.history.push(path);

const showActions = (props: IProps) => {
  const { loanRecord, t } = props;

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
          onClick={goTo(
            `loan/collateral/withdraw/${loanRecord.recordAddress}`,
            props,
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
        onClick={goTo(
          `/loan/collateral/add/${loanRecord.recordAddress}`,
          props,
        )}
      >
        {t('add_collateral')}
      </Button>
      <Button
        primary
        onClick={goTo(`/loan/repay/${loanRecord.recordAddress}`, props)}
      >
        {t('repay')}
      </Button>
    </Button.Group>
  );
};

const LoanDetail = (props: IProps) => {
  const { loanRecord, t, transactionsForRecord } = props;
  const { loanToken, collateralToken, term } = loanRecord;

  const annualPercentageRate = loanToken
    ? loanToken.loanAnnualPercentageRates
      ? calculateRate(
          loanToken.loanAnnualPercentageRates[term.value],
          RatePeriod.Annual,
        ).toFixed(2)
      : '0'
    : '0';

  const collateralRatio = (loanRecord.loanAmount === 0
    ? 0
    : ((loanRecord.collateralAmount * loanRecord.collateralToken.price!) /
        loanRecord.loanAmount /
        loanRecord.loanToken.price!) *
      100
  ).toFixed(2);

  return (
    <div>
      <Form.Item>
        <label htmlFor="loanTokenSymbol">{t('borrow')}:</label>
        <TextBox>
          {loanRecord.loanAmount} {loanToken.symbol}
        </TextBox>
      </Form.Item>
      <Form.Item>
        <label htmlFor="term">{t('term')}:</label>
        <TextBox>{term.text}</TextBox>
      </Form.Item>
      <Form.Item>
        <label htmlFor="apr">{t('apr')}:</label>{' '}
        <TextBox id="apr">{annualPercentageRate}%</TextBox>
      </Form.Item>
      <Form.Item>
        <label htmlFor="collateralTokenSymbol">{t('collateral')}:</label>
        <TextBox>
          {loanRecord.collateralAmount} {collateralToken.symbol}
        </TextBox>
      </Form.Item>
      <Form.Item>
        <label htmlFor="collateralRatio">{t('collateral_ratio')}:</label>
        <TextBox id="collateralRatio">{collateralRatio} %</TextBox>
      </Form.Item>
      {showActions(props)}
      {transactionsForRecord ? (
        <TransactionList transactions={transactionsForRecord} />
      ) : null}
    </div>
  );
};

export default withTranslation()(withRouter(LoanDetail));
