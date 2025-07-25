import React, { useState, useCallback, Fragment } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import Form from '../components/html/Form';
import TextBox from '../components/common/TextBox';
import Button from '../components/html/Button';
import TransactionList from './TransactionList';
import {
  IToken,
  IRecord,
  RecordType,
  IDepositRecord,
  ITransaction,
  ILoanRecord,
  DepositActions,
} from '../stores';
import { getService } from '../services';
import { ZERO, convertWeiToDecimal } from '../utils/BigNumber';
import { withRouter, RouteComponentProps } from 'react-router';
import { useDispatch } from 'react-redux';

interface IProps extends WithTranslation, RouteComponentProps {
  accountAddress: string;
  record: IRecord;
  transactionsForRecord?: ITransaction[];
  tokens: IToken[];
}

const RecordDetail = (props: IProps) => {
  const {
    accountAddress,
    record,
    transactionsForRecord,
    tokens,
    t,
    history,
  } = props;
  const dispatch = useDispatch();

  // State
  const [loading, setLoading] = useState(false);

  // Callback
  const withdrawDeposit = useCallback(async () => {
    const { depositService } = await getService();

    setLoading(true);
    await depositService.withdrawDeposit(accountAddress, record.recordId);
    dispatch(
      DepositActions.UpdateDepositRecord(
        await depositService.getDepositRecordById(record.recordId),
      ),
    );
    setLoading(false);
  }, [setLoading, record]);

  const earlyWithdrawDeposit = useCallback(async () => {
    const { depositService } = await getService();

    setLoading(true);
    await depositService.earlyWithdrawDeposit(accountAddress, record.recordId);
    setLoading(false);
  }, [setLoading, record]);

  const renderDetail = useCallback(
    (r: IRecord) => {
      if (r.recordType === RecordType.Deposit) {
        const depositRecord = record as IDepositRecord;
        const interestEarned = depositRecord.interest || ZERO;

        return (
          <Fragment>
            <Form.Item>
              <label htmlFor="amount">{t('deposit_amount')}</label>
              <TextBox>
                {convertWeiToDecimal(depositRecord.depositAmount)}
              </TextBox>
            </Form.Item>
            <Form.Item>
              <label>{t('interest_earned')}</label>
              <TextBox>{convertWeiToDecimal(interestEarned)}</TextBox>
            </Form.Item>
            <Form.Item>
              <label>{t('pool_id')}</label>
              <TextBox>
                {depositRecord.poolId ? depositRecord.poolId.toString() : ''}
              </TextBox>
            </Form.Item>
            {depositRecord.isMatured && (
              <Form.Item>
                <Button.Group>
                  <Button primary onClick={withdrawDeposit} loading={loading}>
                    {t('withdraw')}
                  </Button>
                </Button.Group>
              </Form.Item>
            )}
            {depositRecord.isEarlyWithdrawable && (
              <Form.Item>
                <Button.Group>
                  <Button
                    primary
                    onClick={earlyWithdrawDeposit}
                    loading={loading}
                  >
                    {t('early_withdraw')}
                  </Button>
                </Button.Group>
              </Form.Item>
            )}
          </Fragment>
        );
      } else {
        const loanRecord = record as ILoanRecord;
        const loanToken = tokens.find(
          token => token.tokenAddress === loanRecord.loanTokenAddress,
        );
        return (
          <Fragment>
            <Form.Item>
              <label htmlFor="loanTokenSymbol">{t('borrow')}: </label>
              <TextBox>
                {convertWeiToDecimal(loanRecord.loanAmount)}{' '}
                {loanToken && loanToken.tokenSymbol}
              </TextBox>
            </Form.Item>
            <Form.Item>
              <label htmlFor="term">{t('term')}:</label>
              <TextBox>{loanRecord.loanTerm.text}</TextBox>
            </Form.Item>
            <Form.Item>
              <label htmlFor="loan_interest">{t('loan_interest')}:</label>
              <TextBox>{convertWeiToDecimal(loanRecord.interest)}</TextBox>
            </Form.Item>
            <Form.Item>
              <label htmlFor="collateral_amount">
                {t('collateral_amount')}:
              </label>
              <TextBox>
                {convertWeiToDecimal(loanRecord.collateralAmount)}
              </TextBox>
            </Form.Item>
            <Form.Item>
              <label htmlFor="collateralTokenSymbol">
                {t('remainingDebt')}:
              </label>
              <TextBox>
                {convertWeiToDecimal(loanRecord.remainingDebt)}{' '}
                {loanToken && loanToken.tokenSymbol}
              </TextBox>
            </Form.Item>
            <Form.Item>
              <label htmlFor="collateralRatio">{t('collateral_ratio')}:</label>
              <TextBox id="collateralRatio">
                {Number.parseFloat(
                  convertWeiToDecimal(loanRecord.collateralCoverageRatio),
                ) * 100}{' '}
                %
              </TextBox>
            </Form.Item>
            {renderActions(loanRecord)}
          </Fragment>
        );
      }
    },
    [record],
  );

  const goTo = useCallback(path => () => history.push(path), [history]);

  const renderActions = useCallback(
    (loanRecord: ILoanRecord) => {
      if (loanRecord.isClosed) {
        return null;
      }
      return (
        <Button.Group>
          <Button onClick={goTo(`/loan/collateral/add/${loanRecord.recordId}`)}>
            {t('add_collateral')}
          </Button>
          <Button primary onClick={goTo(`/loan/repay/${loanRecord.recordId}`)}>
            {t('repay')}
          </Button>
        </Button.Group>
      );
    },
    [renderDetail],
  );

  return (
    <div>
      {renderDetail(record)}
      {transactionsForRecord && (
        <TransactionList
          record={record}
          transactions={transactionsForRecord}
          tokens={tokens}
        />
      )}
    </div>
  );
};

export default withTranslation()(withRouter(RecordDetail));
