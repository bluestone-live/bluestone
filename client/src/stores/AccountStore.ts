import { IAction, IState } from '.';
import { replaceBy } from '../utils/replaceBy';
import { BigNumber } from '../utils/BigNumber';
import { useSelector } from 'react-redux';
import { IToken } from './CommonStore';

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
  numberOfDeposits: BigNumber;
  numberOfLoans: BigNumber;
  numberOfDefaults: BigNumber;
}

export interface ITokenStats {
  tokenAddress: string;
  tokenSymbol: string;
  numberOfDeposits: BigNumber;
  totalDepositAmount: BigNumber;
  numberOfLoans: BigNumber;
  totalLoanAmount: BigNumber;
  numberOfDefaults: BigNumber;
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
    numberOfDeposits: new BigNumber(0),
    numberOfLoans: new BigNumber(0),
    numberOfDefaults: new BigNumber(0),
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
  static setGeneralStat(key: keyof IGeneralStats, value: BigNumber) {
    return {
      type: AccountActionType.SetGeneralStat,
      payload: {
        generalStat: {
          [key]: value,
        },
      },
    };
  }
  static setTokenStat(token: IToken, key: keyof ITokenStats, value: BigNumber) {
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

export const useAvailableCollaterals = () =>
  useSelector<IState, IAvailableCollateral[]>(
    state => state.account.availableCollaterals,
  );

export const useGeneralStats = () =>
  useSelector<IState, IGeneralStats>(state => state.account.generalStats);

export const useTokenStats = () =>
  useSelector<IState, ITokenStats[]>(state => state.account.tokenStats);
