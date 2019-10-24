import React, { useState, useCallback } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import Input from '../components/html/Input';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import Button from '../components/html/Button';
import Form from '../components/html/Form';
import dayjs from 'dayjs';
import {
  convertDecimalToWei,
  BigNumber,
  convertWeiToDecimal,
} from '../utils/BigNumber';
import { stringify } from 'querystring';
import styled from 'styled-components';
import { ThemedProps } from '../styles/themes';
import { Cell } from '../components/common/Layout';
import { getService } from '../services';
import { ILoanRecord, IToken } from '../_stores';

interface IProps extends WithTranslation, RouteComponentProps {
  accountAddress: string;
  record: ILoanRecord;
  tokens: IToken[];
  isUserActionsLocked: boolean;
}

const StyledSuffixButton = styled(Button)`
  width: 100%;
  border-radius: 0 ${(props: ThemedProps) => props.theme.borderRadius.medium}
    ${(props: ThemedProps) => props.theme.borderRadius.medium} 0;

  height: 100%;
`;

const RepayLoanForm = (props: IProps) => {
  const {
    accountAddress,
    record,
    tokens,
    isUserActionsLocked,
    t,
    history,
  } = props;

  // State
  const [amount, setAmount] = useState(0);

  const [loading, setLoading] = useState(false);

  // Computed
  const loanToken = tokens.find(
    token => token.tokenAddress === record.loanTokenAddress,
  );

  // Callback

  const onAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setAmount(Number.parseFloat(e.currentTarget.value)),
    [setAmount],
  );

  const onMaxButtonClick = useCallback(
    (remainingDebt: BigNumber) => (
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    ) => {
      e.preventDefault();
      setAmount(Number.parseFloat(convertWeiToDecimal(remainingDebt)));
    },
    [setAmount],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);

      const { loanService } = await getService();

      try {
        await loanService.repayLoan(
          accountAddress,
          record.recordId,
          convertDecimalToWei(amount),
        );

        setLoading(false);

        history.push({
          pathname: '/records/loan',
          search: stringify({
            tokenAddress: loanToken!.tokenAddress,
            recordId: record.recordId,
          }),
        });
      } catch (e) {
        setLoading(false);
      }
    },
    [setLoading, history],
  );

  return (
    <Card>
      <Form onSubmit={onSubmit}>
        <Form.Item>
          <Cell>
            <label htmlFor="amount">{t('repay')}</label>
          </Cell>
          <Cell scale={4}>
            <Input
              id="amount"
              type="number"
              step={1e-18}
              min={1e-18}
              max={record.remainingDebt}
              value={amount}
              onChange={onAmountChange}
              suffix={
                <StyledSuffixButton
                  primary
                  onClick={onMaxButtonClick(record.remainingDebt)}
                >
                  {t('max')}
                </StyledSuffixButton>
              }
            />
          </Cell>
        </Form.Item>
        <Form.Item>
          <Cell>
            <label>{t('remaining')}</label>
          </Cell>
          <Cell scale={4}>
            <Input
              type="text"
              disabled
              value={`${record.remainingDebt}`}
              suffix={loanToken!.tokenSymbol}
            />
          </Cell>
        </Form.Item>
        <Form.Item>
          <Cell>
            <label>{t('interest')}</label>
          </Cell>
          <Cell scale={4}>
            <Input
              type="text"
              disabled
              value={record.interest}
              suffix={loanToken!.tokenSymbol}
            />
          </Cell>
        </Form.Item>
        <Form.Item>
          <Cell>
            <label>{t('expire_date')}</label>
          </Cell>
          <Cell scale={4}>
            <Input
              type="text"
              disabled
              value={dayjs(record.createdAt)
                .add(record.loanTerm.value, 'day')
                .format('YYYY-MM-DD')}
            />
          </Cell>
        </Form.Item>
        <Form.Item>
          <Cell>
            <label />
          </Cell>
          <Cell scale={4}>
            <Button
              primary
              fullWidth
              disabled={isUserActionsLocked}
              loading={loading}
            >
              {t('repay')}
            </Button>
          </Cell>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default withTranslation()(withRouter(RepayLoanForm));
