import React, { useState, useCallback } from 'react';
import Card from '../components/common/Card';
import { withRouter, RouteComponentProps } from 'react-router';
import {
  convertDecimalToWei,
  convertWeiToDecimal,
  BigNumber,
} from '../utils/BigNumber';
import dayjs from 'dayjs';
import Form from '../components/html/Form';
import { Row, Cell } from '../components/common/Layout';
import Select from '../components/html/Select';
import Input from '../components/html/Input';
import StyledTextBox from '../components/common/TextBox';
import Button from '../components/html/Button';
import { withTranslation, WithTranslation } from 'react-i18next';
import Toggle from '../components/common/Toggle';
import { calcCollateralRatio } from '../utils/calcCollateralRatio';
import { ILoanPair, ITerm, IToken, IAvailableCollateral } from '../_stores';
import { getService } from '../services';
import { stringify } from 'querystring';
import { calcEstimateRepayAmount } from '../utils/calcEstimateRepayAmount';

interface IProps extends WithTranslation, RouteComponentProps {
  accountAddress: string;
  loanTerms: ITerm[];
  availableLoanPairs: ILoanPair[];
  availableCollaterals: IAvailableCollateral[];
  isUserActionsLocked: boolean;
}

const LoanForm = (props: IProps) => {
  const {
    accountAddress,
    loanTerms,
    availableLoanPairs,
    availableCollaterals,
    isUserActionsLocked,
    t,
    history,
  } = props;

  const loanTokens = availableLoanPairs.map(loanPair => loanPair.loanToken);

  // State
  const [loanAmount, setLoanAmount] = useState(0);

  const [collateralAmount, setCollateralAmount] = useState(0);

  const [useAvailableCollateral, setUseAvailableCollateral] = useState(false);

  const [selectedLoanToken, setSelectedLoanToken] = useState(loanTokens[0]);

  const [selectedCollateralToken, setSelectedCollateralToken] = useState<
    IToken
  >();

  const [selectedTerm, setSelectedTerm] = useState(loanTerms[0]);

  const [loading, setLoading] = useState(false);

  // Computed

  const loanTokenOptions = loanTokens.map(loanToken => (
    <option
      key={`loan_${loanToken.tokenAddress}`}
      value={loanToken.tokenAddress}
    >
      {loanToken.tokenSymbol}
    </option>
  ));

  const collateralTokens = availableLoanPairs
    .filter(
      loanPair =>
        loanPair.loanToken.tokenAddress === selectedLoanToken.tokenAddress,
    )
    .map(loanPair => loanPair.collateralToken);

  const collateralTokenOptions = collateralTokens.map(collateralToken => (
    <option
      key={`loan_${collateralToken.tokenAddress}`}
      value={collateralToken.tokenAddress}
    >
      {collateralToken.tokenSymbol}
    </option>
  ));

  const selectedLoanPair = availableLoanPairs.find(
    loanPair =>
      loanPair.loanToken.tokenAddress === selectedLoanToken.tokenAddress &&
      selectedCollateralToken &&
      loanPair.collateralToken.tokenAddress ===
        selectedCollateralToken.tokenAddress,
  );

  let currCollateralRatio = '0';
  let minCollateralRatio = '0';

  let estimateRepayAmount = '0';

  const estimatedRepayDate = dayjs()
    .endOf('day')
    .add(selectedTerm.value, 'day')
    .format('DD/MM/YYYY');

  if (
    selectedLoanPair &&
    selectedLoanPair.annualPercentageRate &&
    selectedCollateralToken
  ) {
    estimateRepayAmount = calcEstimateRepayAmount(
      loanAmount,
      Number.parseInt(selectedLoanPair.annualPercentageRate.toString(), 10),
    ).toString();

    currCollateralRatio = calcCollateralRatio(
      collateralAmount.toString(),
      estimateRepayAmount,
      selectedCollateralToken.price,
      selectedLoanToken.price,
    );

    minCollateralRatio = `${(
      Number.parseFloat(
        convertWeiToDecimal(
          selectedLoanPair.loanToken.collateralCoverageRatio,
          2,
        ),
      ) * 100
    ).toFixed(2)}`;
  }

  const selectedAvailableCollateralItem = selectedCollateralToken
    ? availableCollaterals.find(
        availableCollateral =>
          availableCollateral.tokenAddress ===
          selectedCollateralToken.tokenAddress,
      )
    : null;

  // Callback
  const onLoanTokenSelect = useCallback(
    ({ currentTarget: { value } }: React.ChangeEvent<HTMLSelectElement>) => {
      const loanToken = loanTokens.find(token => token.tokenAddress === value);
      if (loanToken) {
        setSelectedLoanToken(loanToken);
      }
    },
    [setSelectedLoanToken],
  );

  const onCollateralTokenSelect = useCallback(
    ({ currentTarget: { value } }: React.ChangeEvent<HTMLSelectElement>) => {
      const collateralToken = collateralTokens.find(
        token => token.tokenAddress === value,
      );
      if (collateralToken) {
        setSelectedCollateralToken(collateralToken);
      }
    },
    [setSelectedCollateralToken],
  );

  const onTermSelect = useCallback(
    ({ currentTarget: { value } }: React.ChangeEvent<HTMLSelectElement>) =>
      setSelectedTerm({
        text: `${value}-Day`,
        value: Number.parseInt(value, 10),
      }),
    [setSelectedTerm],
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

  const onUseAvailableCollateralChange = useCallback(
    (value: boolean) => setUseAvailableCollateral(value),
    [setUseAvailableCollateral],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);

      if (!selectedLoanToken || !selectedCollateralToken || !selectedTerm) {
        return;
      }

      try {
        const { loanService } = await getService();
        const recordId = await loanService.loan(
          accountAddress,
          selectedLoanToken.tokenAddress,
          selectedCollateralToken.tokenAddress,
          convertDecimalToWei(loanAmount),
          convertDecimalToWei(collateralAmount),
          new BigNumber(selectedTerm.value),
          useAvailableCollateral,
        );
        setLoading(false);

        history.push({
          pathname: '/records/loan',
          search: stringify({
            currentToken: selectedLoanToken.tokenAddress,
            recordId,
          }),
        });
      } catch (e) {
        setLoading(false);
      }
    },
    [setLoading],
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
                  value={selectedLoanToken.tokenAddress}
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
                <Select
                  id="term"
                  name="term"
                  value={selectedTerm.value}
                  onChange={onTermSelect}
                >
                  {loanTerms}
                </Select>
              </Cell>
            </Form.Item>
            <Form.Item>
              <Cell>
                <label htmlFor="apr">{t('apr')}:</label>{' '}
              </Cell>
              <Cell>
                <StyledTextBox id="apr">
                  {selectedLoanPair && selectedLoanPair.annualPercentageRate} %
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
                    selectedCollateralToken
                      ? selectedCollateralToken.tokenSymbol
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
                  disabled={!!selectedAvailableCollateralItem}
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
                    {selectedLoanToken.tokenSymbol} in estimation before{' '}
                    {estimatedRepayDate}.
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
