import React, { useCallback, useState } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import Input from '../components/html/Input';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import Button from '../components/html/Button';
import Form from '../components/html/Form';
import dayjs from 'dayjs';
import { convertDecimalToWei, convertWeiToDecimal } from '../utils/BigNumber';
import { stringify } from 'querystring';
import Toggle from '../components/common/Toggle';
import { Row, Cell } from '../components/common/Layout';
import TextBox from '../components/common/TextBox';
import { getService } from '../services';
import { IToken, ILoanRecord, IAvailableCollateral } from '../stores';

interface IProps extends WithTranslation, RouteComponentProps {
  accountAddress: string;
  record?: ILoanRecord;
  availableCollaterals: IAvailableCollateral[];
  isUserActionsLocked: boolean;
  tokens: IToken[];
}

const AddCollateralForm = (props: IProps) => {
  const {
    accountAddress,
    record,
    availableCollaterals,
    isUserActionsLocked,
    tokens,
    history,
    t,
  } = props;

  if (!record || tokens.length === 0) {
    return null;
  }

  // State
  const [amount, setAmount] = useState(0);
  const [useAvailableCollateral, setUseAvailableCollateral] = useState(false);
  const [loading, setLoading] = useState(false);

  // Computed
  const loanToken = tokens.find(
    token => token.tokenAddress === record.loanTokenAddress,
  );

  const collateralToken = tokens.find(
    token => token.tokenAddress === record.collateralTokenAddress,
  );

  const availableCollateral = availableCollaterals.find(
    collateral => collateral.tokenAddress === record.collateralTokenAddress,
  );

  // Callback
  const onAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setAmount(Number.parseFloat(e.currentTarget.value)),
    [setAmount],
  );

  const onUseAvailableCollateralChange = useCallback(
    (value: boolean) => setUseAvailableCollateral(value),
    [setUseAvailableCollateral],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (isUserActionsLocked) {
        return;
      }
      const { loanService } = await getService();

      setLoading(true);

      try {
        await loanService.addCollateral(
          accountAddress,
          record.recordId,
          convertDecimalToWei(amount),
          useAvailableCollateral,
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
    [
      accountAddress,
      record,
      amount,
      useAvailableCollateral,
      isUserActionsLocked,
    ],
  );

  return (
    <Card>
      <Form onSubmit={onSubmit}>
        <Form.Item>
          <Row>
            <Cell>
              <label>{t('current_collateral')}</label>
            </Cell>
            <Cell scale={3}>
              <Input
                type="text"
                disabled
                value={convertWeiToDecimal(record.collateralAmount)}
                suffix={collateralToken!.tokenSymbol}
              />
            </Cell>
          </Row>
        </Form.Item>
        <Form.Item>
          <Row>
            <Cell>
              <label htmlFor="amount">{t('add_collateral_amount')}</label>
            </Cell>
            <Cell scale={3}>
              <Input
                id="amount"
                type="number"
                step={1e-18}
                min={1e-18}
                onChange={onAmountChange}
                suffix={collateralToken!.tokenSymbol}
              />
            </Cell>
          </Row>
        </Form.Item>
        <Form.Item>
          <Row>
            <Cell>
              <label>{t('current_collateral_ratio')}</label>
            </Cell>
            <Cell scale={3}>
              <TextBox>
                {Number.parseFloat(
                  convertWeiToDecimal(record.currentCollateralRatio),
                ) * 100}{' '}
                %
              </TextBox>
            </Cell>
          </Row>
        </Form.Item>
        <Form.Item>
          <Row>
            <Cell>
              <label>{t('expired_at')}</label>
            </Cell>
            <Cell scale={3}>
              <Input
                type="text"
                disabled
                value={dayjs(record.createdAt)
                  .add(record.loanTerm.value, 'day')
                  .format('YYYY-MM-DD')}
              />
            </Cell>
          </Row>
        </Form.Item>
        <Form.Item key="use_available_collateral">
          <Row>
            <Cell>
              <label>{t('use_available_collateral')}</label>
            </Cell>
            <Cell scale={3}>
              <Toggle
                defaultValue={useAvailableCollateral}
                onChange={onUseAvailableCollateralChange}
              />
            </Cell>
          </Row>
        </Form.Item>
        <Form.Item key="available_collateral_amount">
          <Row>
            <Cell>
              <label>{t('available_collateral_amount')}</label>
            </Cell>
            <Cell scale={3}>
              <TextBox>
                {availableCollateral
                  ? convertWeiToDecimal(availableCollateral.amount)
                  : 0}
              </TextBox>
            </Cell>
          </Row>
        </Form.Item>
        <Form.Item>
          <Row>
            <Cell>
              <label />
            </Cell>
            <Cell scale={3}>
              <Button
                primary
                fullWidth
                disabled={isUserActionsLocked}
                loading={loading}
              >
                {t('add_collateral')}
              </Button>
            </Cell>
          </Row>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default withTranslation()(withRouter(AddCollateralForm));
