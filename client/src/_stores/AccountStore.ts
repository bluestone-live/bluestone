import { IAction } from '.';
import { replaceBy } from '../utils/replaceWith';

enum AccountActionType {
  SetAccounts = 'SET_ACCOUNTS',
  SetGeneralStat = 'SET_GENERAL_STAT',
  SetTokenStat = 'SET_TOKEN_STAT',
  SetFreedCollateral = 'SET_FREED_COLLATERAL',
}

export interface IFreedCollateral {
  tokenAddress: string;
  tokenSymbol: string;
  amount: string;
}

export interface IGeneralStats {
  totalDeposits: string;
  totalLoans: string;
  totalDefaults: string;
}

export interface ITokenStats {
  tokenAddress: string;
  tokenSymbol: string;
  totalDeposits: string;
  totalDepositAmount: string;
  totalLoans: string;
  totalLoanAmount: string;
  totalDefaults: string;
}

interface IAccountState {
  accounts: string[];
  generalStats: IGeneralStats;
  tokenStats: ITokenStats[];
  freedCollaterals: IFreedCollateral[];
}

const initState: IAccountState = {
  accounts: [],
  generalStats: {
    totalDeposits: '0',
    totalLoans: '0',
    totalDefaults: '0',
  },
  tokenStats: [],
  freedCollaterals: [],
};

export const AccountReducer = (
  state: IAccountState = initState,
  action: IAction<AccountActionType>,
) => {
  switch (action.type) {
    case AccountActionType.SetAccounts:
      return replaceBy(state, { accounts: action.payload.accounts });
    case AccountActionType.SetFreedCollateral:
      return {
        ...state,
        freedCollaterals: replaceBy(
          state.freedCollaterals,
          action.payload.freedCollateral,
          'tokenAddress',
        ),
      };
    case AccountActionType.SetGeneralStat:
      return {
        ...state,
        generalStats: replaceBy(state.generalStats, action.payload.generalStat),
      };
    case AccountActionType.SetTokenStat:
      return {
        ...state,
        tokenStats: replaceBy(
          state.tokenStats,
          action.payload.tokenStats,
          'tokenAddress',
        ),
      };
    default:
      return state;
  }
};

export class AccountActions {
  static setAccounts(accounts: string[]) {
    return {
      type: AccountActionType.SetAccounts,
      payload: { accounts },
    };
  }
  static setFreedCollateral(freedCollateral: IFreedCollateral) {
    return {
      type: AccountActionType.SetFreedCollateral,
      payload: {
        freedCollateral,
      },
    };
  }
  static setGeneralStat(generalStat: IGeneralStats) {
    return {
      type: AccountActionType.SetGeneralStat,
      payload: {
        generalStat,
      },
    };
  }
  static setTokenStat(tokenStats: ITokenStats) {
    return {
      type: AccountActionType.SetTokenStat,
      payload: {
        tokenStats,
      },
    };
  }
}
