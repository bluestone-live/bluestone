import { BigNumber } from '../utils/BigNumber';
import { IAction, IState } from '.';
import { Contract } from 'web3-eth-contract';
import { replaceBy } from '../utils/replaceBy';
import { useSelector } from 'react-redux';

const enum CommonActionType {
  SetCurrentNetwork = 'SET_CURRENT_NETWORK',
  SetUserActionsLock = 'SET_USER_ACTIONS_LOCK',
  SetAvailableDepositTokens = 'SET_AVAILABLE_DEPOSIT_TOKENS',
  SetAvailableLoanPairs = 'SET_AVAILABLE_LOAN_PAIRS',
  SetAllowance = 'SET_ALLOWANCE',
  SetDepositTerms = 'SET_DEPOSIT_TERMS',
  SetLoanTerms = 'SET_LOAN_TERMS',
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
}

interface ICommonState {
  currentNetwork?: number;
  isUserActionsLocked: boolean;
  depositTerms: BigNumber[];
  availableDepositTokens: IToken[];
  loanTerms: BigNumber[];
  availableLoanPairs: ILoanPair[];
  protocolContractAddress?: string;
}

const initState: ICommonState = {
  currentNetwork: undefined,
  isUserActionsLocked: true,
  depositTerms: [],
  availableDepositTokens: [],
  loanTerms: [],
  availableLoanPairs: [],
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
    case CommonActionType.SetAvailableDepositTokens:
      return {
        ...state,
        availableDepositTokens: action.payload.availableDepositTokens,
      };
    case CommonActionType.SetAvailableLoanPairs:
      return {
        ...state,
        availableLoanPairs: action.payload.availableLoanPairs,
      };
    case CommonActionType.SetAllowance:
      return {
        ...state,
        availableLoanPairs: replaceBy(
          state.availableLoanPairs,
          action.payload.allowance,
          'allowance',
        ),
      };
    case CommonActionType.SetDepositTerms:
      return {
        ...state,
        depositTerms: action.payload.depositTerms,
      };
    case CommonActionType.SetLoanTerms:
      return {
        ...state,
        loanTerms: action.payload.loanTerms,
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

  static setAvailableDepositTokens(availableDepositTokens: IToken[]) {
    return {
      type: CommonActionType.SetAvailableDepositTokens,
      payload: {
        availableDepositTokens,
      },
    };
  }

  static setAvailableLoanPairs(availableLoanPairs: ILoanPair[]) {
    return {
      type: CommonActionType.SetAvailableLoanPairs,
      payload: {
        availableLoanPairs,
      },
    };
  }

  static setAllowance(
    allowance: Array<{ tokenAddress: string; allowance: BigNumber }>,
  ) {
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

  static setLoanTerms(loanTerms: BigNumber[]) {
    return {
      type: CommonActionType.SetLoanTerms,
      payload: {
        loanTerms,
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

export const useAvailableDepositTokens = () =>
  useSelector((state: IState) => state.common.availableDepositTokens);
