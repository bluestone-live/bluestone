import * as React from 'react';
import LoanForm from '../containers/LoanForm';
import { RouteComponentProps, withRouter } from 'react-router';
import parseQuery from '../utils/parseQuery';
import { stringify } from 'querystring';
import { inject } from 'mobx-react';
import { TokenStore, LoanManagerStore, loanManagerStore } from '../stores';
import { IToken } from '../constants/Token';
import { terms } from '../constants/Term';

interface IProps extends RouteComponentProps {
  tokenStore: TokenStore;
  loanManagerStore: LoanManagerStore;
  term: number;
  loanTokenSymbol: string;
  collateralTokenSymbol: string;
  onSelectChange: (
    key: string,
  ) => (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

@inject('tokenStore', 'loanManagerStore')
class LoanPage extends React.Component<IProps> {
  componentDidMount() {
    this.setDefaultParams();
  }

  componentDidUpdate() {
    this.setDefaultParams();
  }

  setDefaultParams = () => {
    const {
      location: { search },
      tokenStore,
    } = this.props;
    const { term, loanTokenSymbol, collateralTokenSymbol } = parseQuery(search);

    const tokenSymbolList = tokenStore.validTokens.map(
      (token: IToken) => token.symbol,
    );

    if (
      !loanTokenSymbol ||
      !collateralTokenSymbol ||
      !term ||
      loanTokenSymbol === collateralTokenSymbol
    ) {
      const defaultLoanSymbol = loanTokenSymbol || tokenSymbolList[0];
      const defaultCollateralSymbol =
        collateralTokenSymbol && loanTokenSymbol !== collateralTokenSymbol
          ? collateralTokenSymbol
          : loanManagerStore!.getCollateralSymbolsByLoanSymbol(
              defaultLoanSymbol,
            )[0];
      const defaultTerm = terms[0].value.toString();

      this.updateQueryParams({
        loanTokenSymbol: defaultLoanSymbol,
        collateralTokenSymbol: defaultCollateralSymbol,
        term: defaultTerm,
      });
    }
  };

  updateQueryParams = (params: { [key: string]: string }) => {
    const {
      location: { search },
      history,
    } = this.props;

    history.replace({
      pathname: window.location.pathname,
      search: stringify({
        ...parseQuery(search),
        ...params,
      }),
    });
  };

  onSelectChange = (key: string) => ({
    currentTarget: { value },
  }: React.ChangeEvent<HTMLSelectElement>) => {
    this.updateQueryParams({ [key]: value });
  };

  render() {
    const {
      location: { search },
    } = this.props;
    const { term, loanTokenSymbol, collateralTokenSymbol } = parseQuery(search);

    if (
      !loanTokenSymbol ||
      !collateralTokenSymbol ||
      !term ||
      loanTokenSymbol === collateralTokenSymbol
    ) {
      return null;
    }

    return (
      <LoanForm
        term={Number.parseInt(term, 10)}
        loanTokenSymbol={loanTokenSymbol}
        collateralTokenSymbol={collateralTokenSymbol}
        onSelectChange={this.onSelectChange}
      />
    );
  }
}

export default withRouter(LoanPage);
