import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import {
  ILoanRecord,
  ILoanPair,
  ViewActions,
  CommonActions,
  useLoadingType,
  LoadingType,
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
  const {
    accountAddress,
    protocolContractAddress,
    record,
    selectedLoanPair,
    history,
    t,
  } = props;
  const dispatch = useDispatch();

  const loadingType = useLoadingType();

  const [collateralRatio, setCollateralRatio] = useState<number>(
    Number.parseFloat(
      convertWeiToDecimal(selectedLoanPair.minCollateralCoverageRatio),
    ) * 100,
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
      if (
        selectedLoanPair.loanToken.allowance &&
        selectedLoanPair.loanToken.allowance.toString() === '0'
      ) {
        const { commonService } = await getService();
        await commonService.approveFullAllowance(
          accountAddress,
          selectedLoanPair.loanToken,
          protocolContractAddress,
        );

        dispatch(
          CommonActions.setAllowance(
            selectedLoanPair.loanToken.tokenAddress,
            await commonService.getTokenAllowance(
              selectedLoanPair.loanToken,
              accountAddress,
              protocolContractAddress,
            ),
          ),
        );
      } else {
        const { loanService } = await getService();

        await loanService.addCollateral(
          accountAddress,
          record.recordId,
          record.collateralTokenAddress,
          convertDecimalToWei(additionalCollateralAmount),
        );

        dispatch(ViewActions.setBanner(t('common_add_collateral_succeed')));

        history.push(`/account/borrow/${record.recordId}`);
      }
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

  const buttonText = useMemo(() => {
    if (loadingType !== LoadingType.None) {
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
                symbol: selectedLoanPair.collateralToken.tokenSymbol,
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
          disabled={
            loadingType !== LoadingType.None || additionalCollateralAmount <= 0
          }
          onClick={submit}
        >
          {buttonText}
        </Button>
      </Form>
    </div>
  );
};

export default withTranslation()(withRouter(AddCollateralForm));
