import React, { useState, useCallback, ChangeEvent } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { ILoanRecord, ILoanPair } from '../stores';
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

interface IProps extends WithTranslation {
  accountAddress: string;
  record: ILoanRecord;
  selectedLoanPair: ILoanPair;
}

const AddCollateralForm = (props: IProps) => {
  const { accountAddress, record, selectedLoanPair, t } = props;

  const [collateralRatio, setCollateralRatio] = useState<number>(
    Number.parseFloat(
      convertWeiToDecimal(selectedLoanPair.minCollateralCoverageRatio),
    ) * 100,
  );
  const [collateralAmount, setCollateralAmount] = useState<number>(0);

  const onCollateralRatioChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setCollateralRatio(
        Number.parseFloat(e.target.value === '' ? '0' : e.target.value),
      );
      if (selectedLoanPair.collateralToken && selectedLoanPair.loanToken) {
        setCollateralAmount(
          Number.parseFloat(
            calcCollateralAmount(
              e.target.value,
              record.remainingDebt || '0', // TODO(ZhangRGK): use total debt instead
              selectedLoanPair.collateralToken.price,
              selectedLoanPair.loanToken.price,
            ),
          ),
        );
      }
    },
    [record, selectedLoanPair],
  );

  const modifyCollateralRatio = useCallback(
    (num: number) => () => {
      setCollateralRatio(collateralRatio + num);
      if (selectedLoanPair.collateralToken && selectedLoanPair.loanToken) {
        setCollateralAmount(
          Number.parseFloat(
            calcCollateralAmount(
              (collateralRatio + num).toString(),
              record.remainingDebt || '0', // TODO(ZhangRGK): use total debt instead
              selectedLoanPair.collateralToken.price,
              selectedLoanPair.loanToken.price,
            ),
          ),
        );
      }
    },
    [collateralRatio, selectedLoanPair, record],
  );

  const onCollateralAmountChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setCollateralAmount(Number.parseFloat(e.target.value));
      if (selectedLoanPair.collateralToken && selectedLoanPair.loanToken) {
        setCollateralRatio(
          Number.parseFloat(
            calcCollateralRatio(
              e.target.value,
              record.remainingDebt || '0', // TODO(ZhangRGK): use total debt instead
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
    const { loanService } = await getService();

    await loanService.addCollateral(
      accountAddress,
      record.recordId,
      record.collateralTokenAddress,
      convertDecimalToWei(collateralAmount),
    );
  }, [accountAddress, record, collateralAmount]);

  return (
    <div className="add-collateral-form">
      <div className="notice">
        {t('add_collateral_form_notice', {
          minCollateralRatio: convertWeiToDecimal(
            selectedLoanPair.minCollateralCoverageRatio,
          ),
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
          type="text"
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
          label={t('add_collateral_form_label_targeting_collateral_amount')}
          type="text"
          value={collateralAmount}
          onChange={onCollateralAmountChange}
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
        <Button type="primary" block size="large" onClick={submit}>
          {t('add_collateral_form_button_add_collateral')}
        </Button>
      </Form>
    </div>
  );
};

export default withTranslation()(AddCollateralForm);
