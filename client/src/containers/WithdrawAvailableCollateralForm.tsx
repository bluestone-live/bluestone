import React, { useCallback, useState } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import Input from '../components/html/Input';
import Button from '../components/html/Button';
import Form from '../components/html/Form';
import { convertDecimalToWei, convertWeiToDecimal } from '../utils/BigNumber';
import { Cell } from '../components/common/Layout';
import StyledTextBox from '../components/common/TextBox';
import { IAvailableCollateral, IToken } from '../stores';
import { getService } from '../services';
import { RouteComponentProps, withRouter } from 'react-router';

interface IProps extends WithTranslation, RouteComponentProps {
  accountAddress: string;
  token: IToken;
  availableCollaterals: IAvailableCollateral[];
}

const WithdrawAvailableCollateralForm = (props: IProps) => {
  const { accountAddress, token, availableCollaterals, history, t } = props;

  // State
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Computed
  const availableCollateral = availableCollaterals.find(
    collateral => collateral.tokenAddress === token.tokenAddress,
  );

  // Callback
  const onAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setAmount(Number.parseFloat(e.currentTarget.value)),
    [setAmount],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);
      try {
        const { accountService } = await getService();

        await accountService.withdrawAvailableCollateral(
          accountAddress,
          token.tokenAddress,
          convertDecimalToWei(amount),
        );

        setLoading(false);
        history.push('/account');
      } catch (e) {
        // TODO: Show error messages
        setLoading(false);
      }
    },
    [accountAddress, token, amount],
  );

  return (
    <Card>
      <Form onSubmit={onSubmit}>
        <Form.Item>
          <Cell>
            <label htmlFor="amount">{t('collateral_amount')}</label>
          </Cell>
          <Cell scale={4}>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={onAmountChange}
              suffix={token.tokenSymbol}
            />
          </Cell>
        </Form.Item>
        <Form.Item>
          <Cell>
            <label>{t('available_amount')}</label>
          </Cell>
          <Cell scale={4}>
            <StyledTextBox>
              {availableCollateral
                ? convertWeiToDecimal(availableCollateral.amount)
                : 0}{' '}
              {token.tokenSymbol}
            </StyledTextBox>
          </Cell>
        </Form.Item>
        <Form.Item>
          <Cell>
            <label />
          </Cell>
          <Cell scale={4}>
            <Button primary fullWidth loading={loading}>
              {t('withdraw')}
            </Button>
          </Cell>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default withTranslation()(withRouter(WithdrawAvailableCollateralForm));
