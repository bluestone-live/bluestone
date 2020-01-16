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

interface IProps extends WithTranslation, RouteComponentProps {
  record: ILoanRecord;
  selectedLoanPair: ILoanPair;
  transactions: ITransaction[];
}

const BorrowDetail = (props: IProps) => {
  const { record, selectedLoanPair, transactions, history, t } = props;

  const collateralRatio = useMemo(() => {
    return `${Number.parseFloat(
      convertWeiToDecimal(record.currentCollateralRatio),
    )}%
    /
    ${Number.parseFloat(
      convertWeiToDecimal(selectedLoanPair.minCollateralCoverageRatio),
    ) * 100}%`;
  }, [record, selectedLoanPair]);

  const tokens = useMemo(
    () => [selectedLoanPair.loanToken, selectedLoanPair.collateralToken],
    [selectedLoanPair],
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
        <Col span={12}>
          <TextBox label={t('borrow_detail_label_amount')}>
            {convertWeiToDecimal(record.loanAmount)}
          </TextBox>
        </Col>
        <Col span={12}>
          <TextBox label={t('borrow_detail_label_term')}>
            {t('borrow_detail_text_term', { term: record.loanTerm.value })}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <TextBox label={t('borrow_detail_label_total_collateral')}>
            {convertWeiToDecimal(record.loanAmount)}
          </TextBox>
        </Col>
        <Col span={12}>
          <TextBox label={t('borrow_detail_label_collateral_ratio')}>
            {collateralRatio}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <TextBox label={t('borrow_detail_label_liquidated_collateral')}>
            {convertWeiToDecimal('0')}{' '}
            {selectedLoanPair.collateralToken.tokenSymbol}
            {/* TODO: Add liquidated amount */}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <TextBox label={t('borrow_detail_label_remaining_debt')}>
            {convertWeiToDecimal(record.remainingDebt)}
          </TextBox>
        </Col>
        <Col span={12}>
          <TextBox label={t('borrow_detail_label_total_debt')}>
            {convertWeiToDecimal('0')} {/* TODO: Add total debt */}
          </TextBox>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <TextBox label={t('borrow_detail_label_due_date')}>
            {record.createdAt + record.loanTerm.value}
            {/* TODO: Add total debt */}
          </TextBox>
        </Col>
      </Row>
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
      <TransactionList
        tokens={tokens}
        record={record}
        transactions={transactions}
      />
    </div>
  );
};

export default withTranslation()(withRouter(BorrowDetail));
