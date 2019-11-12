import { IAction, IState } from '.';
import { replaceBy } from '../utils/replaceBy';
import { BigNumber } from '../utils/BigNumber';
import { useSelector } from 'react-redux';

enum AccountActionType {
  SetAccounts = 'SET_ACCOUNTS',
  SetGeneralStat = 'SET_GENERAL_STAT',
  SetTokenStat = 'SET_TOKEN_STAT',
  SetAvailableCollaterals = 'SET_FREED_COLLATERALS',
}

export interface IAvailableCollateral {
  tokenAddress: string;
  amount: BigNumber;
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
  availableCollaterals: IAvailableCollateral[];
}

const initState: IAccountState = {
  accounts: [],
  generalStats: {
    totalDeposits: '0',
    totalLoans: '0',
    totalDefaults: '0',
  },
  tokenStats: [],
  availableCollaterals: [],
};

export const AccountReducer = (
  state: IAccountState = initState,
  action: IAction<AccountActionType>,
): IAccountState => {
  switch (action.type) {
    case AccountActionType.SetAccounts:
      return replaceBy(state, { accounts: action.payload.accounts });
    case AccountActionType.SetAvailableCollaterals:
      return {
        ...state,
        availableCollaterals: action.payload.availableCollaterals,
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
  static setAvailableCollaterals(availableCollaterals: IAvailableCollateral[]) {
    return {
      type: AccountActionType.SetAvailableCollaterals,
      payload: {
        availableCollaterals,
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

// Selectors

export const useDefaultAccount = () =>
  useSelector((state: IState) => state.account.accounts[0]);
