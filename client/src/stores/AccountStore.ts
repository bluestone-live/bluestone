import { IAction, IState } from '.';
import { replaceBy } from '../utils/replaceBy';
import { useSelector } from 'react-redux';
import { IToken } from './CommonStore';

enum AccountActionType {
  SetAccounts = 'SET_ACCOUNTS',
  SetGeneralStat = 'SET_GENERAL_STAT',
  SetTokenStat = 'SET_TOKEN_STAT',
  SetAvailableCollaterals = 'SET_FREED_COLLATERALS',
  SetAccountBalance = 'SET_ACCOUNT_BALANCE',
}

export interface IBalance {
  tokenAddress: string;
  balance: string;
}

export interface IGeneralStats {
  numberOfDeposits: string;
  numberOfLoans: string;
  numberOfDefaults: string;
}

export interface ITokenStats {
  tokenAddress: string;
  tokenSymbol: string;
  numberOfDeposits: string;
  totalDepositAmount: string;
  numberOfLoans: string;
  totalLoanAmount: string;
  numberOfDefaults: string;
}

interface IAccountState {
  accounts: string[];
  tokenBalance: IBalance[];
  generalStats: IGeneralStats;
  tokenStats: ITokenStats[];
}

const initState: IAccountState = {
  accounts: [],
  tokenBalance: [],
  generalStats: {
    numberOfDeposits: '0',
    numberOfLoans: '0',
    numberOfDefaults: '0',
  },
  tokenStats: [],
};

export const AccountReducer = (
  state: IAccountState = initState,
  action: IAction<AccountActionType>,
): IAccountState => {
  switch (action.type) {
    case AccountActionType.SetAccounts:
      return replaceBy(state, { accounts: action.payload.accounts });
    case AccountActionType.SetGeneralStat:
      return {
        ...state,
        generalStats: replaceBy(state.generalStats, action.payload.generalStat),
      };
    case AccountActionType.SetTokenStat:
      const tokenStat = state.tokenStats.find(
        stat => stat.tokenAddress === action.payload.tokenAddress,
      );
      return {
        ...state,
        tokenStats: tokenStat
          ? state.tokenStats.map(stat =>
              stat.tokenAddress === action.payload.tokenAddress
                ? { ...stat, ...action.payload.tokenStat }
                : stat,
            )
          : [...state.tokenStats, action.payload.tokenStat],
      };
    case AccountActionType.SetAccountBalance:
      if (
        state.tokenBalance.find(
          b => b.tokenAddress === action.payload.tokenAddress,
        )
      ) {
        return {
          ...state,
          tokenBalance: state.tokenBalance.map(b =>
            b.tokenAddress === action.payload.tokenAddress
              ? { ...b, balance: action.payload.balance }
              : b,
          ),
        };
      }
      return {
        ...state,
        tokenBalance: [...state.tokenBalance, action.payload],
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
  static setTokenBalance(tokenAddress: string, balance: string) {
    return {
      type: AccountActionType.SetAccountBalance,
      payload: {
        tokenAddress,
        balance,
      },
    };
  }
  static setGeneralStat(key: keyof IGeneralStats, value: string) {
    return {
      type: AccountActionType.SetGeneralStat,
      payload: {
        generalStat: {
          [key]: value,
        },
      },
    };
  }
  static setTokenStat(token: IToken, key: keyof ITokenStats, value: string) {
    return {
      type: AccountActionType.SetTokenStat,
      payload: {
        tokenAddress: token.tokenAddress,
        tokenStat: {
          tokenAddress: token.tokenAddress,
          tokenSymbol: token.tokenSymbol,
          [key]: value,
        },
      },
    };
  }
}

// Selectors

export const useDefaultAccount = () =>
  useSelector<IState, string>(state => state.account.accounts[0]);

export const useTokenBalance = () =>
  useSelector<IState, IBalance[]>(state => state.account.tokenBalance);

export const useGeneralStats = () =>
  useSelector<IState, IGeneralStats>(state => state.account.generalStats);

export const useTokenStats = () =>
  useSelector<IState, ITokenStats[]>(state => state.account.tokenStats);
