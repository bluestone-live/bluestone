import React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { useDepsUpdated } from '../utils/useEffectAsync';
import {
  useDefaultAccount,
  useDepositTerms,
  useDepositTokens,
  useDistributorConfig,
} from '../stores';
import DepositForm from '../containers/DepositForm';

interface IProps
  extends WithTranslation,
    RouteComponentProps<{ tokenAddress: string }> {}

const DepositFormPage = (props: IProps) => {
  const { match, history } = props;

  // Selector

  const defaultAccount = useDefaultAccount();

  const depositTokens = useDepositTokens();

  const defaultToken = depositTokens[0];

  const depositTerms = useDepositTerms();

  const distributorConfig = useDistributorConfig();

  // Initialize
  useDepsUpdated(async () => {
    if (!match.params.tokenAddress && defaultToken) {
      history.replace(`/deposit/${defaultToken.tokenAddress}`);
    }
  }, [defaultToken]);

  const currentToken =
    depositTokens.find(
      token => token.tokenAddress === match.params.tokenAddress,
    ) || defaultToken;

  return currentToken ? (
    <DepositForm
      accountAddress={defaultAccount}
      currentToken={currentToken}
      depositTerms={depositTerms}
      distributorAddress={distributorConfig.address}
      depositDistributorFee={distributorConfig.depositFee}
    />
  ) : null;
};

export default withTranslation()(withRouter(DepositFormPage));
