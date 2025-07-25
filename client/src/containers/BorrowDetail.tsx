import React, { useMemo, useCallback } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router';
import { ILoanRecord, ILoanPair, ITransaction } from '../stores';
import { Row, Col } from 'antd/lib/grid';
import RecordStatus from '../components/RecordStatus';
import TextBox from '../components/TextBox';
import { convertWeiToDecimal } from '../utils/BigNumber';
import TransactionList from '../components/TransactionList';
import Button from 'antd/lib/button';
import { getTimezone } from '../utils/formatSolidityTime';

interface IProps extends WithTranslation, RouteComponentProps {
  record: ILoanRecord;
  selectedLoanPair: ILoanPair;
  transactions: ITransaction[];
}

const BorrowDetail = (props: IProps) => {
  const { record, selectedLoanPair, transactions, history, t } = props;

  const collateralRatio = useMemo(() => {
    const currentCollateralRatio =
      Number.parseFloat(
        convertWeiToDecimal(record.collateralCoverageRatio, 2),
      ) * 100;

    const minCollateralCoverageRatio =
      Number.parseFloat(
        convertWeiToDecimal(selectedLoanPair.minCollateralCoverageRatio),
      ) * 100;

    const currentCollateralRatioColor =
      currentCollateralRatio < minCollateralCoverageRatio ? 'yellow' : 'green';

    return (
      <span>
        <span className={currentCollateralRatioColor}>
          {currentCollateralRatio.toFixed(0)}%
        </span>
        /{minCollateralCoverageRatio}%;
      </span>
    );
  }, [record, selectedLoanPair]);

  const tokens = useMemo(
    () => [selectedLoanPair.loanToken, selectedLoanPair.collateralToken],
    [selectedLoanPair],
  );

  const transactionsOfRecord = useMemo(
    () => transactions.filter(tx => tx.recordId === record.recordId),
    [transactions, record],
  );

  const goTo = useCallback(
    (path: string) => () => {
      history.push(path);
    },
    [history],
  );

  return (
    <div className="borrow-detail">
      <Row>
        <Col span={24}>
          <RecordStatus record={record} />
        </Col>
      </Row>
      <Row>
        <Col span={8}>
          <TextBox label={t('borrow_detail_label_amount')}>
            {convertWeiToDecimal(
              record.loanAmount,
              4,
              selectedLoanPair.loanToken.decimals,
            )}{' '}
            {selectedLoanPair.loanToken.tokenSymbol}
          </TextBox>
        </Col>
        <Col span={8}>
          <TextBox label={t('borrow_detail_label_term')}>
            {t('borrow_detail_text_term', { term: record.loanTerm.value })}
          </TextBox>
        </Col>
        <Col span={8}>
          <TextBox label={t('borrow_form_text_apr')}>
            {`${(
              Number.parseFloat(
                convertWeiToDecimal(record.annualInterestRate),
              ) * 100
            ).toFixed(2)}%`}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <TextBox label={t('borrow_detail_label_total_collateral')}>
            {convertWeiToDecimal(record.collateralAmount)}{' '}
            {selectedLoanPair.collateralToken.tokenSymbol}
          </TextBox>
        </Col>
        {!record.isClosed && (
          <Col span={12}>
            <TextBox label={t('borrow_detail_label_collateral_ratio')}>
              {collateralRatio}
            </TextBox>
          </Col>
        )}
      </Row>
      <Row>
        <Col span={24}>
          <TextBox label={t('borrow_detail_label_liquidated_collateral')}>
            {convertWeiToDecimal(record.soldCollateralAmount)}{' '}
            {selectedLoanPair.collateralToken.tokenSymbol}
          </TextBox>
        </Col>
      </Row>
      <Row>
        {!record.isClosed && (
          <Col span={12}>
            <TextBox label={t('borrow_detail_label_remaining_debt')}>
              {convertWeiToDecimal(
                record.remainingDebt,
                4,
                selectedLoanPair.loanToken.decimals,
              )}{' '}
              {selectedLoanPair.loanToken.tokenSymbol}
            </TextBox>
          </Col>
        )}
        <Col span={12}>
          <TextBox label={t('borrow_detail_label_total_debt')}>
            {(
              Number.parseFloat(
                convertWeiToDecimal(
                  record.loanAmount,
                  4,
                  selectedLoanPair.loanToken.decimals,
                ),
              ) +
              Number.parseFloat(
                convertWeiToDecimal(
                  record.interest,
                  4,
                  selectedLoanPair.loanToken.decimals,
                ),
              )
            ).toFixed(4)}{' '}
            {selectedLoanPair.loanToken.tokenSymbol}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <TextBox
            label={`${t('borrow_detail_label_due_date')} (${getTimezone()})`}
          >
            {record.dueAt.local().format('YYYY.MM.DD HH:mm')}
          </TextBox>
        </Col>
      </Row>
      {!record.isClosed && (
        <Row className="action-buttons">
          <Col span={12}>
            <Button
              block
              onClick={goTo(`/borrow/${record.recordId}/add-collateral`)}
            >
              {t('borrow_detail_button_add_collateral')}
            </Button>
          </Col>
          <Col span={12}>
            <Button block onClick={goTo(`/borrow/${record.recordId}/repay`)}>
              {t('borrow_detail_button_repay')}
            </Button>
          </Col>
        </Row>
      )}
      <TransactionList
        tokens={tokens}
        record={record}
        transactions={transactionsOfRecord}
      />
    </div>
  );
};

export default withTranslation()(withRouter(BorrowDetail));
