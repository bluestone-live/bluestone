import React, { useState, useCallback, useMemo } from 'react';
import Card from '../components/common/Card';
import { withRouter, RouteComponentProps } from 'react-router';
import dayjs from 'dayjs';
import {
  convertDecimalToWei,
  convertWeiToDecimal,
  BigNumber,
} from '../utils/BigNumber';
import Form from '../components/html/Form';
import { Row, Cell } from '../components/common/Layout';
import Select from '../components/html/Select';
import Input from '../components/html/Input';
import StyledTextBox from '../components/common/TextBox';
import Button from '../components/html/Button';
import { withTranslation, WithTranslation } from 'react-i18next';
import Toggle from '../components/common/Toggle';
import { calcCollateralRatio } from '../utils/calcCollateralRatio';
import { ILoanPair, IAvailableCollateral, IToken } from '../stores';
import { getService } from '../services';
import { stringify } from 'querystring';
import { calcEstimateRepayAmount } from '../utils/calcEstimateRepayAmount';
import parseQuery from '../utils/parseQuery';

interface IProps extends WithTranslation, RouteComponentProps {
  accountAddress?: string;
  loanTokens: IToken[];
  collateralTokens: IToken[];
  selectedLoanPair?: ILoanPair;
  availableCollaterals: IAvailableCollateral[];
  isUserActionsLocked?: boolean;
  distributorAddress: string;
}

const LoanForm = (props: IProps) => {
  const {
    accountAddress,
    loanTokens,
    collateralTokens,
    selectedLoanPair,
    availableCollaterals,
    isUserActionsLocked,
    distributorAddress,
    t,
    history,
    location: { search },
  } = props;

  // State
  const [loanAmount, setLoanAmount] = useState(0);

  const [collateralAmount, setCollateralAmount] = useState(0);

  const [useAvailableCollateral, setUseAvailableCollateral] = useState(false);

  const [selectedLoanTerm, setSelectedLoanTerm] = useState(1);

  const [loading, setLoading] = useState(false);

  // Computed
  const loanTokenOptions = useMemo(
    () =>
      loanTokens.map(loanToken => (
        <option
          key={`loan_${loanToken.tokenAddress}`}
          value={loanToken.tokenAddress}
        >
          {loanToken.tokenSymbol}
        </option>
      )),
    [loanTokens],
  );

  const collateralTokenOptions = collateralTokens.map(collateralToken => (
    <option
      key={`loan_${collateralToken.tokenAddress}`}
      value={collateralToken.tokenAddress}
    >
      {collateralToken.tokenSymbol}
    </option>
  ));

  const estimatedRepayDate = useMemo(
    () =>
      dayjs()
        .endOf('day')
        .add(selectedLoanTerm, 'day')
        .format('DD/MM/YYYY'),
    [selectedLoanTerm],
  );

  const estimateRepayAmount = useMemo(() => {
    if (
      selectedLoanPair &&
      selectedLoanPair.annualPercentageRate &&
      selectedLoanPair.collateralToken
    ) {
      return calcEstimateRepayAmount(
        loanAmount,
        Number.parseInt(selectedLoanPair.annualPercentageRate.toString(), 10),
      ).toString();
    }
    return '0';
  }, [selectedLoanPair, loanAmount]);

  const minCollateralRatio = useMemo(() => {
    if (selectedLoanPair) {
      return `${(
        Number.parseFloat(
          convertWeiToDecimal(selectedLoanPair.minCollateralCoverageRatio, 2),
        ) * 100
      ).toFixed(2)}`;
    }
    return '0';
  }, [selectedLoanPair]);

  const currCollateralRatio = useMemo(() => {
    if (estimateRepayAmount && selectedLoanPair) {
      return calcCollateralRatio(
        collateralAmount.toString(),
        estimateRepayAmount,
        selectedLoanPair.collateralToken.price,
        selectedLoanPair.loanToken.price,
      );
    }
    return '0';
  }, [collateralAmount, minCollateralRatio, estimateRepayAmount]);

  const selectedAvailableCollateralItem = useMemo(() => {
    if (!selectedLoanPair || availableCollaterals.length === 0) {
      return null;
    }
    return availableCollaterals.find(
      availableCollateral =>
        availableCollateral.tokenAddress ===
        selectedLoanPair.collateralToken.tokenAddress,
    );
  }, [selectedLoanPair, availableCollaterals]);

  // Callback
  const onLoanTokenSelect = useCallback(
    ({ currentTarget: { value } }: React.ChangeEvent<HTMLSelectElement>) => {
      if (loanTokens.find(token => token.tokenAddress === value)) {
        history.replace({
          pathname: window.location.pathname,
          search: stringify({
            ...parseQuery(search),
            loanTokenAddress: value,
          }),
        });
      }
    },
    [loanTokens],
  );

  const onCollateralTokenSelect = useCallback(
    ({ currentTarget: { value } }: React.ChangeEvent<HTMLSelectElement>) => {
      if (collateralTokens.find(token => token.tokenAddress === value)) {
        history.replace({
          pathname: window.location.pathname,
          search: stringify({
            ...parseQuery(search),
            collateralTokenAddress: value,
          }),
        });
      }
    },
    [collateralTokens],
  );

  const onLoanAmountChange = useCallback(
    ({ currentTarget: { value } }: React.ChangeEvent<HTMLInputElement>) =>
      setLoanAmount(Number.parseFloat(value)),
    [setLoanAmount],
  );

  const onCollateralAmountChange = useCallback(
    ({ currentTarget: { value } }: React.ChangeEvent<HTMLInputElement>) =>
      setCollateralAmount(Number.parseFloat(value)),
    [setCollateralAmount],
  );

  const onLoanTermChange = useCallback(
    ({ currentTarget: { value } }: React.ChangeEvent<HTMLInputElement>) =>
      setSelectedLoanTerm(Number.parseInt(value, 10)),
    [setLoanAmount],
  );

  const onUseAvailableCollateralChange = useCallback(
    (value: boolean) => setUseAvailableCollateral(value),
    [setUseAvailableCollateral],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);

      if (!accountAddress || !selectedLoanPair || !selectedLoanTerm) {
        return;
      }

      try {
        const { loanService } = await getService();
        const recordId = await loanService.loan(
          accountAddress,
          selectedLoanPair.loanToken.tokenAddress,
          selectedLoanPair.collateralToken.tokenAddress,
          convertDecimalToWei(loanAmount),
          convertDecimalToWei(collateralAmount),
          new BigNumber(selectedLoanTerm),
          useAvailableCollateral,
          distributorAddress,
        );

        setLoading(false);

        history.push({
          pathname: '/records/loan',
          search: stringify({
            currentToken: selectedLoanPair.loanToken.tokenAddress,
            recordId,
          }),
        });
      } catch (e) {
        setLoading(false);
      }
    },
    [
      accountAddress,
      selectedLoanPair,
      loanAmount,
      collateralAmount,
      selectedLoanTerm,
      useAvailableCollateral,
    ],
  );

  return (
    <div>
      <Card>
        <Form onSubmit={onSubmit}>
          <Row>
            <Form.Item>
              <Cell>
                <label htmlFor="loanTokenSymbol">{t('borrow')}:</label>
              </Cell>
              <Cell>
                <Select
                  id="loanTokenSymbol"
                  name="loanTokenSymbol"
                  value={
                    selectedLoanPair
                      ? selectedLoanPair.loanToken.tokenAddress
                      : ''
                  }
                  onChange={onLoanTokenSelect}
                >
                  {loanTokenOptions}
                </Select>
              </Cell>
            </Form.Item>
            <Form.Item>
              <Cell>
                <label htmlFor="loanAmount">{t('amount')}:</label>
              </Cell>
              <Cell>
                <Input
                  id="loanAmount"
                  name="loanAmount"
                  type="number"
                  step="any"
                  min="0"
                  onChange={onLoanAmountChange}
                  value={loanAmount}
                />
              </Cell>
            </Form.Item>
          </Row>
          <Row>
            <Form.Item>
              <Cell>
                <label htmlFor="term">{t('term')}:</label>
              </Cell>
              <Cell>
                <Input
                  id="loanTerm"
                  name="loanTerm"
                  type="number"
                  step="any"
                  min="1"
                  max={Number.parseInt(
                    selectedLoanPair && selectedLoanPair.maxLoanTerm
                      ? selectedLoanPair.maxLoanTerm.toString()
                      : '1',
                    10,
                  )}
                  onChange={onLoanTermChange}
                  value={selectedLoanTerm}
                />
              </Cell>
            </Form.Item>
            <Form.Item>
              <Cell>
                <label htmlFor="apr">{t('apr')}:</label>
              </Cell>
              <Cell>
                <StyledTextBox id="apr">
                  {selectedLoanPair &&
                    convertWeiToDecimal(selectedLoanPair.annualPercentageRate)}
                  %
                </StyledTextBox>
              </Cell>
            </Form.Item>
          </Row>
          <Row>
            <Form.Item>
              <Cell>
                <label htmlFor="collateralTokenSymbol">
                  {t('collateral')}:
                </label>
              </Cell>
              <Cell>
                <Select
                  id="collateralTokenSymbol"
                  name="collateralTokenSymbol"
                  value={
                    selectedLoanPair
                      ? selectedLoanPair.collateralToken.tokenAddress
                      : ''
                  }
                  onChange={onCollateralTokenSelect}
                >
                  {collateralTokenOptions}
                </Select>
              </Cell>
            </Form.Item>
            <Form.Item>
              <Cell>
                <label htmlFor="collateralAmount">{t('amount')}:</label>
              </Cell>
              <Cell>
                <Input
                  id="collateralAmount"
                  type="number"
                  name="collateralAmount"
                  step="any"
                  min="0"
                  value={collateralAmount}
                  onChange={onCollateralAmountChange}
                />
              </Cell>
            </Form.Item>
          </Row>
          <Row>
            <Form.Item>
              <Cell>
                <label htmlFor="collateralRatio">
                  {t('collateral_ratio')}:
                </label>
              </Cell>
              <Cell>
                <StyledTextBox id="collateralRatio">
                  {currCollateralRatio} % / {minCollateralRatio} %
                </StyledTextBox>
              </Cell>
            </Form.Item>
            <Form.Item>&nbsp;</Form.Item>
          </Row>
          <Row>
            <Form.Item>
              <Cell>
                <label htmlFor="">{t('use_available_collateral')}</label>
              </Cell>
              <Cell>
                <Toggle
                  disabled={!selectedAvailableCollateralItem}
                  defaultValue={useAvailableCollateral}
                  onChange={onUseAvailableCollateralChange}
                />
              </Cell>
            </Form.Item>
            <Form.Item key="available_collateral_amount">
              <Cell>
                <label>{t('available_collateral_amount')}</label>
              </Cell>
              <Cell>
                <StyledTextBox>
                  {selectedAvailableCollateralItem &&
                    convertWeiToDecimal(selectedAvailableCollateralItem.amount)}
                </StyledTextBox>
              </Cell>
            </Form.Item>
          </Row>
          {loanAmount > 0 ? (
            <Row>
              <Cell>
                <Form.Item>
                  <StyledTextBox>
                    You need to pay back {estimateRepayAmount}
                    {selectedLoanPair &&
                      selectedLoanPair.loanToken.tokenSymbol}{' '}
                    in estimation before {estimatedRepayDate}.
                  </StyledTextBox>
                </Form.Item>
              </Cell>
            </Row>
          ) : (
            ''
          )}
          <Row>
            <Form.Item>
              <Cell>
                <label />
              </Cell>
              <Cell scale={3}>
                <Button
                  disabled={isUserActionsLocked}
                  primary
                  fullWidth
                  loading={loading}
                >
                  {t('loan')}
                </Button>
              </Cell>
            </Form.Item>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default withTranslation()(withRouter(LoanForm));
