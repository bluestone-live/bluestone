import React, { useCallback, useMemo } from 'react';
import {
  IToken,
  CommonActions,
  ViewActions,
  useLoadingType,
  LoadingType,
} from '../stores';
import Button from 'antd/lib/button';
import { getService } from '../services';
import { useDispatch } from 'react-redux';
import usdc from '../styles/images/usdc.svg';
import usdt from '../styles/images/usdt.svg';
import dai from '../styles/images/dai.svg';

interface IApproveProps {
  token: IToken;
  accountAddress: string;
  protocolContractAddress: string;
  t: any;
}

const ApproveForm = (props: IApproveProps) => {
  const { token, t, accountAddress, protocolContractAddress } = props;
  const tokens: any = {
    DAI: dai,
    USDC: usdc,
    USDT: usdt,
  };

  const loadingType = useLoadingType();
  const dispatch = useDispatch();

  const submit = useCallback(async () => {
    const { commonService } = await getService();

    dispatch(ViewActions.setLoadingType(LoadingType.Approve));

    await commonService.approveFullAllowance(
      accountAddress,
      token,
      protocolContractAddress,
    );

    dispatch(
      CommonActions.setAllowance(
        token.tokenAddress,
        await commonService.getTokenAllowance(
          token,
          accountAddress,
          protocolContractAddress,
        ),
      ),
    );

    dispatch(ViewActions.setLoadingType(LoadingType.None));
  }, [token, loadingType]);

  const buttonText = useMemo(() => {
    if (loadingType !== LoadingType.None) {
      return t(`common_loading_${loadingType}`);
    }

    return t('deposit_form_button_approve');
  }, [token, loadingType]);

  return (
    <div className="approve-form">
      <div>
        <img src={tokens[token.tokenSymbol]} alt={token.tokenSymbol} />
      </div>
      <div>{t('deposit_form_approve_tip', { asset: token.tokenSymbol })}</div>

      <Button
        type="primary"
        block
        onClick={submit}
        disabled={loadingType !== LoadingType.None || token.allowance !== '0'}
      >
        {buttonText}
      </Button>
    </div>
  );
};

export default ApproveForm;
