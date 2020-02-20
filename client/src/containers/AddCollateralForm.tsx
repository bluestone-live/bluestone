import React, { useState, useCallback } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { ILoanRecord, ILoanPair, ViewActions, useLoading } from '../stores';
import CollateralCoverageRatio from '../components/CollateralCoverageRatio';
import { convertWeiToDecimal, convertDecimalToWei } from '../utils/BigNumber';
import TextBox from '../components/TextBox';
import FormInput from '../components/FormInput';
import Form from 'antd/lib/form';
import {
  calcCollateralAmount,
  calcCollateralRatio,
} from '../utils/calcCollateralRatio';
import Button from 'antd/lib/button';
import { getService } from '../services';
import { RouteComponentProps, withRouter } from 'react-router';
import { useDispatch } from 'react-redux';
import { useDepsUpdated } from '../utils/useEffectAsync';

interface IProps extends WithTranslation, RouteComponentProps {
  accountAddress: string;
  record: ILoanRecord;
  selectedLoanPair: ILoanPair;
}

const AddCollateralForm = (props: IProps) => {
  const { accountAddress, record, selectedLoanPair, history, t } = props;
  const dispatch = useDispatch();

  const loading = useLoading();

  const [collateralRatio, setCollateralRatio] = useState<number>(
    Number.parseFloat(
      convertWeiToDecimal(selectedLoanPair.minCollateralCoverageRatio),
    ) * 100,
  );
  const [additionalCollateralAmount, setAdditionalCollateralAmount] = useState<
    number
  >(0);

  useDepsUpdated(async () => {
    if (record) {
      setCollateralRatio(
        Math.max(
          Number.parseFloat(
            convertWeiToDecimal(record.currentCollateralRatio),
          ) * 100,
          Number.parseFloat(
            convertWeiToDecimal(selectedLoanPair.minCollateralCoverageRatio),
          ) * 100,
        ),
      );
    }
  }, [record]);

  const onCollateralRatioChange = useCallback(
    (value: string) => {
      setCollateralRatio(Number.parseFloat(value));
      if (selectedLoanPair.collateralToken && selectedLoanPair.loanToken) {
        setAdditionalCollateralAmount(
          Number.parseFloat(
            calcCollateralAmount(
              value,
              convertWeiToDecimal(record.remainingDebt) || '0',
              selectedLoanPair.collateralToken.price,
              selectedLoanPair.loanToken.price,
            ),
          ) - Number.parseFloat(convertWeiToDecimal(record.collateralAmount)),
        );
      }
    },
    [record, selectedLoanPair],
  );

  const modifyCollateralRatio = useCallback(
    (num: number) => () => {
      setCollateralRatio(collateralRatio + num);
      if (selectedLoanPair.collateralToken && selectedLoanPair.loanToken) {
        setAdditionalCollateralAmount(
          Number.parseFloat(
            calcCollateralAmount(
              (collateralRatio + num).toString(),
              convertWeiToDecimal(record.remainingDebt) || '0',
              selectedLoanPair.collateralToken.price,
              selectedLoanPair.loanToken.price,
            ),
          ) -
            Number.parseFloat(convertWeiToDecimal(record.collateralAmount, 18)),
        );
      }
    },
    [collateralRatio, selectedLoanPair, record],
  );

  const onAdditionalCollateralAmountChange = useCallback(
    (value: string) => {
      setAdditionalCollateralAmount(Number.parseFloat(value));
      if (selectedLoanPair.collateralToken && selectedLoanPair.loanToken) {
        setCollateralRatio(
          Number.parseFloat(
            calcCollateralRatio(
              (
                Number.parseFloat(value) +
                Number.parseFloat(convertWeiToDecimal(record.collateralAmount))
              ).toString(),
              convertWeiToDecimal(record.remainingDebt || '0'),
              selectedLoanPair.collateralToken.price,
              selectedLoanPair.loanToken.price,
            ),
          ),
        );
      }
    },
    [selectedLoanPair, record],
  );

  const submit = useCallback(async () => {
    dispatch(ViewActions.setLoading(true));
    try {
      const { loanService } = await getService();

      await loanService.addCollateral(
        accountAddress,
        record.recordId,
        record.collateralTokenAddress,
        convertDecimalToWei(additionalCollateralAmount),
      );

      history.push(`/account/borrow/${record.recordId}`);
      // Ignore the error
      // tslint:disable-next-line:no-empty
    } catch (e) {}
    dispatch(ViewActions.setLoading(false));
  }, [accountAddress, record, additionalCollateralAmount]);

  return (
    <div className="add-collateral-form">
      <div className="notice">
        {t('add_collateral_form_notice', {
          minCollateralCoverageRatio:
            Number.parseFloat(
              convertWeiToDecimal(selectedLoanPair.minCollateralCoverageRatio),
            ) * 100,
        })}
      </div>
      <Form>
        <CollateralCoverageRatio
          currentCollateralRatio={(
            Number.parseFloat(
              convertWeiToDecimal(record.currentCollateralRatio),
            ) * 100
          ).toFixed(2)}
          minCollateralRatio={(
            Number.parseFloat(
              convertWeiToDecimal(selectedLoanPair.minCollateralCoverageRatio),
            ) * 100
          ).toFixed(2)}
        />
        <TextBox label={t('add_collateral_form_label_collateral_amount')}>
          {convertWeiToDecimal(record.collateralAmount)}
        </TextBox>
        <FormInput
          label={t('add_collateral_form_label_update_collateral_ratio')}
          type="number"
          value={collateralRatio}
          suffix="%"
          onChange={onCollateralRatioChange}
          actionButtons={[
            <Button
              key="collateral_ratio_minus"
              onClick={modifyCollateralRatio(-10)}
            >
              -10%
            </Button>,
            <Button
              key="collateral_ratio_plus"
              onClick={modifyCollateralRatio(10)}
            >
              +10%
            </Button>,
          ]}
          tip={{
            title: t('add_collateral_form_tip_title'),
            content: (
              <div>
                {t('add_collateral_form_tip_content', {
                  minCollateralCoverageRatio:
                    Number.parseFloat(
                      convertWeiToDecimal(
                        selectedLoanPair.minCollateralCoverageRatio,
                      ),
                    ) * 100,
                })}
              </div>
            ),
          }}
        />
        <FormInput
          label={t('add_collateral_form_label_additional_collateral_amount')}
          type="number"
          value={additionalCollateralAmount}
          onChange={onAdditionalCollateralAmountChange}
          suffix={selectedLoanPair.collateralToken.tokenSymbol}
          extra={
            <span className="bold">
              {t('add_collateral_form_input_extra_price', {
                price: convertWeiToDecimal(
                  selectedLoanPair.collateralToken.price,
                  2,
                ),
              })}
            </span>
          }
        />
        <Button
          type="primary"
          block
          size="large"
          disabled={loading || additionalCollateralAmount <= 0}
          onClick={submit}
        >
          {t('add_collateral_form_button_add_collateral')}
        </Button>
      </Form>
    </div>
  );
};

export default withTranslation()(withRouter(AddCollateralForm));
