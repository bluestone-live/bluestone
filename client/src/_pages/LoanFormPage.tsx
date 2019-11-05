import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import parseQuery from '../utils/parseQuery';
import { stringify } from 'querystring';
import { useDispatch, useSelector } from 'react-redux';
import {
  IState,
  ITerm,
  IAvailableCollateral,
  CommonActions,
  ILoanPair,
} from '../_stores';
import { useEffectAsync } from '../utils/useEffectAsync';
import { getService } from '../services';
import LoanForm from '../_containers/LoanForm';

interface IProps extends RouteComponentProps {
  term: number;
  loanTokenSymbol: string;
  collateralTokenSymbol: string;
  onSelectChange: (
    key: string,
  ) => (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const LoanFormPage = (props: IProps) => {
  const dispatch = useDispatch();

  // Selector
  const defaultAccount = useSelector<IState, string>(
    state => state.account.accounts[0],
  );

  const loanTerms = useSelector<IState, ITerm[]>(
    state => state.common.loanTerms,
  );

  const availableLoanPairs = useSelector<IState, ILoanPair[]>(
    state => state.common.availableLoanPairs,
  );

  const availableCollaterals = useSelector<IState, IAvailableCollateral[]>(
    state => state.account.availableCollaterals,
  );

  const isUserActionsLocked = useSelector<IState, boolean>(
    state => state.common.isUserActionsLocked,
  );

  // Initialize

  useEffectAsync(async () => {
    const {
      history,
      location: { search },
    } = props;
    const { commonService } = await getService();

    const loanPairs = await commonService.getLoanAndCollateralTokenPairs();
    dispatch(CommonActions.setAvailableLoanPairs(loanPairs));

    const { term, loanTokenAddress, collateralTokenAddress } = parseQuery(
      search,
    );

    const selectedLoanPair = availableLoanPairs.find(
      loanPair =>
        loanPair.loanToken.tokenAddress === loanTokenAddress &&
        loanPair.collateralToken.tokenAddress === collateralTokenAddress,
    );

    if (
      !loanTokenAddress ||
      !collateralTokenAddress ||
      !term ||
      loanTokenAddress === collateralTokenAddress ||
      selectedLoanPair
    ) {
      const defaultLoanPair = availableLoanPairs[0];
      const defaultTerm = loanTerms[0].value.toString();

      history.replace({
        pathname: window.location.pathname,
        search: stringify({
          ...parseQuery(search),
          loanTokenAddress: defaultLoanPair.loanToken.tokenAddress,
          collateralTokenAddress: defaultLoanPair.collateralToken.tokenAddress,
          term: defaultTerm,
        }),
      });
    }
  });

  return (
    <LoanForm
      accountAddress={defaultAccount}
      loanTerms={loanTerms}
      availableLoanPairs={availableLoanPairs}
      availableCollaterals={availableCollaterals}
      isUserActionsLocked={isUserActionsLocked}
    />
  );
};

export default withRouter(LoanFormPage);
