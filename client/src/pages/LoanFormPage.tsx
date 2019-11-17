import React, { useMemo } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import parseQuery from '../utils/parseQuery';
import { stringify } from 'querystring';
import { useSelector } from 'react-redux';
import {
  IState,
  IAvailableCollateral,
  ILoanPair,
  useDistributorConfig,
} from '../stores';
import { useComponentMounted } from '../utils/useEffectAsync';
import LoanForm from '../containers/LoanForm';
import { uniqueBy } from '../utils/uniqueBy';

interface IProps extends RouteComponentProps {
  term: number;
  loanTokenSymbol: string;
  collateralTokenSymbol: string;
  onSelectChange: (
    key: string,
  ) => (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const LoanFormPage = (props: IProps) => {
  const {
    history,
    location: { search },
  } = props;

  const { term, loanTokenAddress, collateralTokenAddress } = parseQuery(search);

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

  const distributorConfig = useDistributorConfig();

  // Initialize
  useComponentMounted(async () => {
    if (
      (!loanTokenAddress ||
        !collateralTokenAddress ||
        !term ||
        loanTokenAddress === collateralTokenAddress) &&
      loanPairs.length > 0
    ) {
      const defaultLoanPair = loanPairs[0];

      history.replace({
        pathname: window.location.pathname,
        search: stringify({
          ...parseQuery(search),
          loanTokenAddress: defaultLoanPair.loanToken.tokenAddress,
          collateralTokenAddress: defaultLoanPair.collateralToken.tokenAddress,
        }),
      });
    }
  });

  // Computed
  const loanTokens = useMemo(
    () =>
      loanPairs
        ? uniqueBy(
            loanPairs.map(loanPair => loanPair.loanToken),
            'tokenAddress',
          )
        : [],
    [loanPairs],
  );

  const selectedLoanToken = useMemo(
    () => loanTokens.find(token => token.tokenAddress === loanTokenAddress),
    [loanTokens, loanTokenAddress],
  );

  const collateralTokens = useMemo(() => {
    if (loanPairs.length === 0 || !selectedLoanToken) {
      return [];
    }
    return loanPairs
      .filter(
        loanPair =>
          loanPair.loanToken.tokenAddress === selectedLoanToken.tokenAddress,
      )
      .map(loanPair => loanPair.collateralToken);
  }, [loanPairs, selectedLoanToken]);

  const selectedCollateralToken = useMemo(
    () =>
      collateralTokens.find(
        token => token.tokenAddress === collateralTokenAddress,
      ),
    [collateralTokens, collateralTokenAddress],
  );

  const selectedLoanPair = useMemo(() => {
    if (
      loanPairs.length === 0 ||
      !selectedLoanToken ||
      !selectedCollateralToken
    ) {
      return undefined;
    }
    return loanPairs.find(
      loanPair =>
        loanPair.loanToken.tokenAddress === selectedLoanToken.tokenAddress &&
        selectedCollateralToken &&
        loanPair.collateralToken.tokenAddress ===
          selectedCollateralToken.tokenAddress,
    );
  }, [loanPairs, selectedLoanToken, selectedCollateralToken]);

  return (
    <LoanForm
      accountAddress={defaultAccount}
      selectedLoanPair={selectedLoanPair}
      loanTokens={loanTokens}
      collateralTokens={collateralTokens}
      availableCollaterals={availableCollaterals}
      isUserActionsLocked={isUserActionsLocked}
      distributorAddress={distributorConfig.address}
    />
  );
};

export default withRouter(LoanFormPage);
