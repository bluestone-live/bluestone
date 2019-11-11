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
} from '../stores';
import { getService } from '../services';
import { ZERO } from '../utils/BigNumber';
import { withRouter, RouteComponentProps } from 'react-router';

interface IProps extends WithTranslation, RouteComponentProps {
  accountAddress: string;
  record: IRecord;
  transactionsForRecord?: ITransaction[];
  tokens: IToken[];
  isUserActionsLocked: boolean;
}

const RecordDetail = (props: IProps) => {
  const {
    accountAddress,
    record,
    transactionsForRecord,
    tokens,
    isUserActionsLocked,
    t,
    history,
  } = props;

  // State
  const [loading, setLoading] = useState(false);

  // Callback
  const withdraw = useCallback(async () => {
    const { depositService } = await getService();

    setLoading(true);
    await depositService.withdrawDeposit(accountAddress, record.recordId);
    setLoading(false);
  }, [setLoading]);

  const earlyWithdraw = useCallback(async () => {
    const { depositService } = await getService();

    setLoading(true);
    await depositService.earlyWithdrawDeposit(accountAddress, record.recordId);
    setLoading(false);
  }, [setLoading]);

  const renderDetail = useCallback(
    (r: IRecord) => {
      if (r.recordType === RecordType.Deposit) {
        const depositRecord = record as IDepositRecord;
        const interestEarned = depositRecord.interestIndex
          ? depositRecord.depositAmount.mul(depositRecord.interestIndex)
          : ZERO;

        return (
          <Fragment>
            <Form.Item>
              <label htmlFor="amount">{t('deposit_amount')}</label>
              <TextBox>{depositRecord.depositAmount}</TextBox>
            </Form.Item>
            <Form.Item>
              <label>{t('interest_earned')}</label>
              <TextBox>{interestEarned}</TextBox>
            </Form.Item>
            {depositRecord.isMatured && (
              <Form.Item>
                <Button.Group>
                  <Button
                    primary
                    onClick={withdraw}
                    disabled={isUserActionsLocked}
                    loading={loading}
                  >
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
                    onClick={earlyWithdraw}
                    disabled={isUserActionsLocked}
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
        const collateralToken = tokens.find(
          token => token.tokenAddress === loanRecord.collateralTokenAddress,
        );

        return (
          <Fragment>
            <Form.Item>
              <label htmlFor="loanTokenSymbol">{t('borrow')}: </label>
              <TextBox>
                {loanRecord.loanAmount} {loanToken && loanToken.tokenSymbol}
              </TextBox>
            </Form.Item>
            <Form.Item>
              <label htmlFor="term">{t('term')}:</label>
              <TextBox>{loanRecord.loanTerm.text}</TextBox>
            </Form.Item>
            <Form.Item>
              <label htmlFor="collateralTokenSymbol">{t('collateral')}:</label>
              <TextBox>
                {loanRecord.collateralAmount}{' '}
                {collateralToken && collateralToken.tokenSymbol}
              </TextBox>
            </Form.Item>
            <Form.Item>
              <label htmlFor="collateralRatio">{t('collateral_ratio')}:</label>
              <TextBox id="collateralRatio">
                {loanRecord.currentCollateralRatio} %
              </TextBox>
            </Form.Item>
            {renderActions(loanRecord.recordId)}
          </Fragment>
        );
      }
    },
    [withdraw],
  );

  const goTo = useCallback(path => () => history.push(path), [history]);

  const renderActions = useCallback(
    (recordId: string) => (
      <Button.Group>
        <Button
          disabled={isUserActionsLocked}
          onClick={goTo(`/loan/collateral/add/${recordId}`)}
        >
          {t('add_collateral')}
        </Button>
        <Button
          primary
          disabled={isUserActionsLocked}
          onClick={goTo(`/loan/repay/${recordId}`)}
        >
          {t('repay')}
        </Button>
      </Button.Group>
    ),
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
