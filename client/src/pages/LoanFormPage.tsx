import React, { useMemo } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import parseQuery from '../utils/parseQuery';
import { stringify } from 'querystring';
import { useDispatch } from 'react-redux';
import {
  useDistributorConfig,
  AccountActions,
  useDefaultAccount,
  useLoanPairs,
  useAvailableCollaterals,
} from '../stores';
import { useComponentMounted, useDepsUpdated } from '../utils/useEffectAsync';
import LoanForm from '../containers/LoanForm';
import { uniqueBy } from '../utils/uniqueBy';
import { getService } from '../services';

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

  const dispatch = useDispatch();

  const { term, loanTokenAddress, collateralTokenAddress } = parseQuery(search);

  // Selector
  const accountAddress = useDefaultAccount();

  const loanPairs = useLoanPairs();

  const availableCollaterals = useAvailableCollaterals();

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

  useDepsUpdated(async () => {
    const { accountService } = await getService();

    if (accountAddress) {
      dispatch(
        AccountActions.setAvailableCollaterals(
          await accountService.getAvailableCollaterals(accountAddress),
        ),
      );
    }
  }, [accountAddress]);

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
      accountAddress={accountAddress}
      selectedLoanPair={selectedLoanPair}
      loanTokens={loanTokens}
      collateralTokens={collateralTokens}
      availableCollaterals={availableCollaterals}
      distributorAddress={distributorConfig.address}
    />
  );
};

export default withRouter(LoanFormPage);
