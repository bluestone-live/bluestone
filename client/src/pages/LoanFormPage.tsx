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
} from '../stores';
import { useComponentMounted } from '../utils/useEffectAsync';
import { getService } from '../services';
import LoanForm from '../containers/LoanForm';

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

  const loanPairs = useSelector<IState, ILoanPair[]>(
    state => state.common.loanPairs,
  );

  const availableCollaterals = useSelector<IState, IAvailableCollateral[]>(
    state => state.account.availableCollaterals,
  );

  const isUserActionsLocked = useSelector<IState, boolean>(
    state => state.common.isUserActionsLocked,
  );

  // Initialize

  useComponentMounted(async () => {
    const {
      history,
      location: { search },
    } = props;
    const { commonService } = await getService();

    const loanAndCollateralPairs = await commonService.getLoanAndCollateralTokenPairs();
    dispatch(CommonActions.setLoanPairs(loanAndCollateralPairs));

    const { term, loanTokenAddress, collateralTokenAddress } = parseQuery(
      search,
    );

    const selectedLoanPair = loanPairs.find(
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
      const defaultLoanPair = loanPairs[0];

      history.replace({
        pathname: window.location.pathname,
        search: stringify({
          ...parseQuery(search),
          loanTokenAddress: defaultLoanPair.loanToken.tokenAddress,
          collateralTokenAddress: defaultLoanPair.collateralToken.tokenAddress,
          term: selectedLoanPair!.maxLoanTerm,
        }),
      });
    }
  });

  return (
    <LoanForm
      accountAddress={defaultAccount}
      loanTerms={loanTerms}
      availableLoanPairs={loanPairs}
      availableCollaterals={availableCollaterals}
      isUserActionsLocked={isUserActionsLocked}
    />
  );
};

export default withRouter(LoanFormPage);
