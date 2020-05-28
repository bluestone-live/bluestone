import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  ILoanRecord,
  ILoanPair,
  ViewActions,
  CommonActions,
  useLoadingType,
  LoadingType,
  useDepositTokens,
} from '../stores';
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
import { useDepsUpdated, useComponentMounted } from '../utils/useEffectAsync';
import { BannerType } from '../components/Banner';

interface IProps extends WithTranslation, RouteComponentProps {
  accountAddress: string;
  protocolContractAddress: string;
  record: ILoanRecord;
  selectedLoanPair: ILoanPair;
}

const AddCollateralForm = (props: IProps) => {
  const { accountAddress, record, selectedLoanPair, history, t } = props;
  const dispatch = useDispatch();
  const loadingType = useLoadingType();

  const [collateralRatio, setCollateralRatio] = useState<number>(
    Number.parseFloat(
      convertWeiToDecimal(selectedLoanPair.minCollateralCoverageRatio),
    ) * 100,
  );
  const setSafeCollateralRatio = (value: number) =>
    setCollateralRatio(
      Math.max(
        value,
        Number.parseFloat(
          convertWeiToDecimal(selectedLoanPair.minCollateralCoverageRatio),
        ) * 100,
      ),
    );

  const [additionalCollateralAmount, setAdditionalCollateralAmount] = useState<
    number
  >(0);
  const [maxEther, setMaxEther] = useState('0');

  useComponentMounted(async () => {
    const { accountService } = await getService();
    const wei = await accountService.getETHBalance(accountAddress);
    setMaxEther(wei);
  });

  useDepsUpdated(async () => {
    if (record) {
      setSafeCollateralRatio(
        Number.parseFloat(convertWeiToDecimal(record.collateralCoverageRatio)) *
          100,
      );
    }
  }, [record]);

  const onCollateralRatioChange = useCallback(
    (value: string) => {
      setSafeCollateralRatio(Number.parseFloat(value));
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
      setSafeCollateralRatio(collateralRatio + num);
      if (selectedLoanPair.collateralToken && selectedLoanPair.loanToken) {
        const additionalAmount =
          Number.parseFloat(
            calcCollateralAmount(
              (collateralRatio + num).toString(),
              convertWeiToDecimal(
                record.remainingDebt,
                18,
                selectedLoanPair.loanToken.decimals,
              ) || '0',
              selectedLoanPair.collateralToken.price,
              selectedLoanPair.loanToken.price,
            ),
          ) -
          Number.parseFloat(
            convertWeiToDecimal(
              record.collateralAmount,
              18,
              selectedLoanPair.collateralToken.decimals,
            ),
          );

        setAdditionalCollateralAmount(additionalAmount);
      }
    },
    [collateralRatio, selectedLoanPair, record],
  );

  const onAdditionalCollateralAmountChange = useCallback(
    async (value: string) => {
      const safeValue =
        Math.min(
          Number.parseFloat(convertWeiToDecimal(maxEther)),
          parseFloat(value) +
            Number.parseFloat(convertWeiToDecimal(record.collateralAmount)),
        ) || 0;
      setAdditionalCollateralAmount(safeValue);

      if (selectedLoanPair.collateralToken && selectedLoanPair.loanToken) {
        setCollateralRatio(
          Number.parseFloat(
            calcCollateralRatio(
              safeValue.toString(),
              convertWeiToDecimal(record.remainingDebt || '0'),
              selectedLoanPair.collateralToken.price,
              selectedLoanPair.loanToken.price,
            ),
          ),
        );
      }
    },
    [selectedLoanPair, record, maxEther],
  );

  const submit = useCallback(async () => {
    dispatch(ViewActions.setLoadingType(LoadingType.AddCollateral));

    try {
      const { loanService } = await getService();

      await loanService.addCollateral(
        accountAddress,
        record.recordId,
        record.collateralTokenAddress,
        convertDecimalToWei(
          additionalCollateralAmount.toFixed(18),
          selectedLoanPair && selectedLoanPair.collateralToken.decimals,
        ),
      );

      dispatch(ViewActions.setBanner(t('common_add_collateral_succeed')));

      history.push(`/account/borrow/${record.recordId}`);
      // Ignore the error
      // tslint:disable-next-line:no-empty
    } catch (e) {
      dispatch(
        ViewActions.setBanner(
          t('common_add_collateral_fail_title'),
          BannerType.Warning,
          t('common_add_collateral_fail_content'),
        ),
      );
    }

    dispatch(ViewActions.setLoadingType(LoadingType.None));
  }, [accountAddress, record, additionalCollateralAmount]);

  const removeCollateral = useCallback(async () => {
    dispatch(ViewActions.setLoadingType(LoadingType.SubtractCollateral));

    try {
      const { loanService } = await getService();

      await loanService.removeCollateral(
        accountAddress,
        record.recordId,
        convertDecimalToWei(
          Math.abs(additionalCollateralAmount).toFixed(18),
          selectedLoanPair && selectedLoanPair.collateralToken.decimals,
        ),
      );

      dispatch(ViewActions.setBanner(t('common_add_collateral_succeed')));

      history.push(`/account/borrow/${record.recordId}`);
      // Ignore the error
      // tslint:disable-next-line:no-empty
    } catch (e) {
      dispatch(
        ViewActions.setBanner(
          t('common_add_collateral_fail_title'),
          BannerType.Warning,
          t('common_add_collateral_fail_content'),
        ),
      );
    }

    dispatch(ViewActions.setLoadingType(LoadingType.None));
  }, [accountAddress, record, additionalCollateralAmount]);

  const addButtonText = useMemo(() => {
    if (loadingType === LoadingType.AddCollateral) {
      return t(`common_loading_${loadingType}`);
    }

    if (
      selectedLoanPair.collateralToken.allowance &&
      selectedLoanPair.collateralToken.allowance.toString() === '0'
    ) {
      return t('borrow_form_button_approve');
    }
    return t('add_collateral_form_button_add_collateral');
  }, [selectedLoanPair, loadingType]);

  const removeButtonText = useMemo(() => {
    if (loadingType === LoadingType.SubtractCollateral) {
      return t(`common_loading_${loadingType}`);
    }

    return t('add_collateral_form_button_remove_collateral');
  }, [selectedLoanPair, loadingType]);

  return (
    <div className="add-collateral-form">
      <Form>
        <CollateralCoverageRatio
          currentCollateralRatio={(
            Number.parseFloat(
              convertWeiToDecimal(record.collateralCoverageRatio),
            ) * 100
          ).toFixed(2)}
          minCollateralRatio={(
            Number.parseFloat(
              convertWeiToDecimal(selectedLoanPair.minCollateralCoverageRatio),
            ) * 100
          ).toFixed(2)}
        />

        <div className="notice">
          {t('add_collateral_form_notice', {
            minCollateralCoverageRatio:
              Number.parseFloat(
                convertWeiToDecimal(
                  selectedLoanPair.minCollateralCoverageRatio,
                ),
              ) * 100,
          })}
        </div>

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
              className="collateral_ratio_minus"
              key="collateral_ratio_minus"
              onClick={modifyCollateralRatio(-10)}
            >
              -10%
            </Button>,
            <Button
              className="collateral_ratio_plus"
              key="collateral_ratio_plus"
              onClick={modifyCollateralRatio(10)}
            >
              +10%
            </Button>,
          ]}
        />
        <FormInput
          label={t('add_collateral_form_label_additional_collateral_amount')}
          type="number"
          value={additionalCollateralAmount.toFixed(18)}
          onChange={onAdditionalCollateralAmountChange}
          suffix={selectedLoanPair.collateralToken.tokenSymbol}
          extra={
            <span className="bold">
              {t('add_collateral_form_input_extra_price', {
                symbol: selectedLoanPair.collateralToken.tokenSymbol,
                price: convertWeiToDecimal(
                  selectedLoanPair.collateralToken.price,
                  2,
                ),
              })}
            </span>
          }
        />
        <div className="buttons">
          <Button
            type="primary"
            size="large"
            disabled={
              loadingType !== LoadingType.None ||
              additionalCollateralAmount >= 0
            }
            onClick={removeCollateral}
          >
            {removeButtonText}
          </Button>
          <Button
            type="primary"
            size="large"
            disabled={
              loadingType !== LoadingType.None ||
              additionalCollateralAmount <= 0
            }
            onClick={submit}
          >
            {addButtonText}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default withTranslation()(withRouter(AddCollateralForm));
