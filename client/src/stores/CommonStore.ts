import { BigNumber } from '../utils/BigNumber';
import { IAction, IState } from '.';
import { Contract } from 'web3-eth-contract';
import { useSelector } from 'react-redux';
import { replaceBy } from '../utils/replaceBy';

const enum CommonActionType {
  SetCurrentNetwork = 'SET_CURRENT_NETWORK',
  SetUserActionsLock = 'SET_USER_ACTIONS_LOCK',
  SetDepositTokens = 'SET_DEPOSIT_TOKENS',
  SetLoanPairs = 'SET_LOAN_PAIRS',
  SetAllowance = 'SET_ALLOWANCE',
  SetDepositTerms = 'SET_DEPOSIT_TERMS',
  SetMaxLoanTerm = 'SET_LOAN_TERMS',
  SetLoanAPR = 'SET_LOAN_APR',
  SetProtocolContractAddress = 'SET_PROTOCOL_CONTRACT_ADDRESS',
}

export interface IToken {
  tokenAddress: string;
  tokenSymbol: string;
  allowance?: BigNumber;
  price?: BigNumber;
  erc20Instance: Contract;
  collateralCoverageRatio?: BigNumber;
}

export interface ITerm {
  text: string;
  value: number;
}

export interface ILoanPair {
  loanToken: IToken;
  collateralToken: IToken;
  annualPercentageRate?: BigNumber;
  maxLoanTerm?: BigNumber;
}

interface ICommonState {
  currentNetwork?: number;
  isUserActionsLocked: boolean;
  depositTerms: BigNumber[];
  depositTokens: IToken[];
  loanPairs: ILoanPair[];
  protocolContractAddress?: string;
}

const initState: ICommonState = {
  currentNetwork: undefined,
  isUserActionsLocked: true,
  depositTerms: [],
  depositTokens: [],
  loanPairs: [],
  protocolContractAddress: undefined,
};

export const CommonReducer = (
  state: ICommonState = initState,
  action: IAction<CommonActionType>,
) => {
  switch (action.type) {
    case CommonActionType.SetCurrentNetwork:
      return { ...state, currentNetwork: action.payload.currentNetwork };
    case CommonActionType.SetUserActionsLock:
      return {
        ...state,
        isUserActionsLocked: action.payload.isUserActionsLocked,
      };
    case CommonActionType.SetDepositTokens:
      return {
        ...state,
        depositTokens: action.payload.depositTokens,
      };
    case CommonActionType.SetLoanPairs:
      return {
        ...state,
        loanPairs: action.payload.loanPairs,
      };
    case CommonActionType.SetAllowance:
      return {
        ...state,
        depositTokens: state.depositTokens.map(token =>
          token.tokenAddress === action.payload.allowance.tokenAddress
            ? { ...token, allowance: action.payload.allowance.allowanceAmount }
            : token,
        ),
      };
    case CommonActionType.SetDepositTerms:
      return {
        ...state,
        depositTerms: action.payload.depositTerms,
      };
    case CommonActionType.SetMaxLoanTerm:
      return {
        ...state,
        loanPairs: state.loanPairs.map(loanPair =>
          loanPair.loanToken.tokenAddress === action.payload.tokenAddress
            ? replaceBy(loanPair, { maxLoanTerm: action.payload.maxLoanTerm })
            : loanPair,
        ),
      };
    case CommonActionType.SetLoanAPR:
      return {
        ...state,
        loanPairs: state.loanPairs.map(loanPair =>
          loanPair.loanToken.tokenAddress === action.payload.tokenAddress
            ? replaceBy(loanPair, {
                annualPercentageRate: action.payload.annualPercentageRate,
              })
            : loanPair,
        ),
      };
    case CommonActionType.SetProtocolContractAddress:
      return {
        ...state,
        protocolContractAddress: action.payload.protocolContractAddress,
      };
    default:
      return state;
  }
};

export class CommonActions {
  static setCurrentNetwork(network: number) {
    return {
      type: CommonActionType.SetCurrentNetwork,
      payload: {
        currentNetwork: network,
      },
    };
  }

  static setUserActionsLock(isUserActionsLocked: boolean) {
    return {
      type: CommonActionType.SetUserActionsLock,
      payload: {
        isUserActionsLocked,
      },
    };
  }

  static setDepositTokens(depositTokens: IToken[]) {
    return {
      type: CommonActionType.SetDepositTokens,
      payload: {
        depositTokens,
      },
    };
  }

  static setLoanPairs(loanPairs: ILoanPair[]) {
    return {
      type: CommonActionType.SetLoanPairs,
      payload: {
        loanPairs,
      },
    };
  }

  static setAllowance(allowance: {
    tokenAddress: string;
    allowanceAmount: BigNumber;
  }) {
    return {
      type: CommonActionType.SetAllowance,
      payload: {
        allowance,
      },
    };
  }

  static setDepositTerms(depositTerms: BigNumber[]) {
    return {
      type: CommonActionType.SetDepositTerms,
      payload: {
        depositTerms,
      },
    };
  }

  static setMaxLoanTerm(tokenAddress: string, maxLoanTerm: BigNumber) {
    return {
      type: CommonActionType.SetMaxLoanTerm,
      payload: {
        tokenAddress,
        maxLoanTerm,
      },
    };
  }

  static setLoanAPR(tokenAddress: string, annualPercentageRate: BigNumber) {
    return {
      type: CommonActionType.SetLoanAPR,
      payload: {
        tokenAddress,
        annualPercentageRate,
      },
    };
  }

  static setProtocolContractAddress(protocolContractAddress: string) {
    return {
      type: CommonActionType.SetProtocolContractAddress,
      payload: {
        protocolContractAddress,
      },
    };
  }
}

// Selectors

export const useDepositTokens = () =>
  useSelector<IState, IToken[]>(state => state.common.depositTokens);

export const useDepositTerms = () =>
  useSelector<IState, ITerm[]>(state =>
    state.common.depositTerms
      .map((bigNumber: BigNumber) => ({ value: bigNumber.toString() }))
      .map(({ value }: { value: string }) => ({
        text: `${value}-Day`,
        value: Number.parseInt(value, 10),
      })),
  );

export const useLoanPairs = () =>
  useSelector<IState, ILoanPair[]>(state => state.common.loanPairs);

export const useUserActionLock = () =>
  useSelector<IState, boolean>(state => state.common.isUserActionsLocked);
