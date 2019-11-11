import React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffectAsync } from '../utils/useEffectAsync';
import { IState, IToken, CommonActions, ITerm } from '../stores';
import { getService } from '../services';
import DepositForm from '../containers/DepositForm';

interface IProps
  extends WithTranslation,
    RouteComponentProps<{ tokenSymbol: string }> {}

const DepositFormPage = (props: IProps) => {
  const dispatch = useDispatch();

  // Selector

  const defaultAccount = useSelector<IState, string>(
    state => state.account.accounts[0],
  );

  const defaultToken = useSelector<IState, IToken>(
    state => state.common.availableDepositTokens[0],
  );

  const depositTerms = useSelector<IState, ITerm[]>(
    state => state.common.depositTerms,
  );

  const isUserActionsLocked = useSelector<IState, boolean>(
    state => state.common.isUserActionsLocked,
  );

  // Initialize

  useEffectAsync(async () => {
    const { match, history } = props;
    const { commonService } = await getService();

    const depositTokens = await commonService.getDepositTokens();
    dispatch(CommonActions.setAvailableDepositTokens(depositTokens));

    if (!match.params.tokenSymbol && defaultToken) {
      history.replace(`/deposit/${defaultToken.tokenAddress}`);
    }
  });

  return (
    <DepositForm
      accountAddress={defaultAccount}
      currentToken={defaultToken}
      depositTerms={depositTerms}
      isUserActionsLocked={isUserActionsLocked}
    />
  );
};

export default withTranslation()(withRouter(DepositFormPage));
