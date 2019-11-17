import React, { useCallback, useState } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import Input from '../components/html/Input';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import Radio from '../components/common/Radio';
import Button from '../components/html/Button';
import { convertDecimalToWei, BigNumber } from '../utils/BigNumber';
import Form from '../components/html/Form';
import { Cell } from '../components/common/Layout';
import { stringify } from 'querystring';
import { IToken, ITerm } from '../stores';
import { getService } from '../services';
import { useDepsUpdated } from '../utils/useEffectAsync';

interface IProps extends WithTranslation, RouteComponentProps {
  accountAddress: string;
  currentToken: IToken;
  depositTerms: ITerm[];
  isUserActionsLocked: boolean;
  distributorAddress: string;
  depositDistributorFee: number;
}

const DepositForm = (props: IProps) => {
  const {
    accountAddress,
    currentToken,
    depositTerms,
    isUserActionsLocked,
    distributorAddress,
    depositDistributorFee,
    history,
    t,
  } = props;

  // State
  const [depositAmount, setDepositAmount] = useState(0);

  const [selectedTerm, setSelectedTerm] = useState();

  const [loading, setLoading] = useState(false);

  // Initialize
  useDepsUpdated(async () => {
    setSelectedTerm(depositTerms[0]);
  }, [depositTerms]);

  // Callback
  const onAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setDepositAmount(Number.parseFloat(e.currentTarget.value)),
    [],
  );

  const onTermSelect = useCallback(
    (value: number) =>
      setSelectedTerm({
        text: `${value}-Day`,
        value,
      }),
    [setSelectedTerm],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      setLoading(true);
      try {
        const { depositService } = await getService();

        const recordId = await depositService.deposit(
          accountAddress,
          currentToken.tokenAddress,
          convertDecimalToWei(depositAmount),
          new BigNumber(selectedTerm.value),
          distributorAddress,
          depositDistributorFee,
        );

        setLoading(false);

        history.push({
          pathname: '/records/deposit',
          search: stringify({
            currentToken: currentToken.tokenAddress,
            recordId,
          }),
        });
      } catch (e) {
        setLoading(false);
      }
    },
    [
      selectedTerm,
      depositAmount,
      accountAddress,
      currentToken,
      depositTerms,
      isUserActionsLocked,
    ],
  );

  return (
    <Card>
      <Form onSubmit={onSubmit}>
        <Form.Item>
          <Cell>
            <label htmlFor="amount">{t('deposit_amount')}</label>
          </Cell>
          <Cell scale={4}>
            <Input
              fullWidth
              id="amount"
              type="number"
              step={1e-18}
              min={1e-18}
              onChange={onAmountChange}
              suffix={currentToken.tokenSymbol}
            />
          </Cell>
        </Form.Item>
        <Form.Item>
          <Cell>
            <label>{t('select_term')}</label>
          </Cell>
          <Cell scale={4}>
            <Radio<number>
              name="term"
              options={depositTerms}
              onChange={onTermSelect}
              selectedOption={selectedTerm}
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
              {t('deposit')}
            </Button>
          </Cell>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default withTranslation()(withRouter(DepositForm));
