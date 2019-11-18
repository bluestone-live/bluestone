import { BigNumber } from '../utils/BigNumber';
import { IAction, IState } from '.';
import { Contract } from 'web3-eth-contract';
import { useSelector } from 'react-redux';
import { replaceBy } from '../utils/replaceBy';
import { IDistributorConfig } from '../utils/decodeDistributorConfig';

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
  SetTokenPrice = 'SET_TOKEN_PRICE',
  SetDistributorConfig = 'SET_DISTRIBUTOR_CONFIG',
}

export interface IToken {
  tokenAddress: string;
  tokenSymbol: string;
  allowance?: BigNumber;
  price?: BigNumber;
  erc20Instance: Contract;
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
  minCollateralCoverageRatio: BigNumber;
}

interface ICommonState {
  currentNetwork?: number;
  isUserActionsLocked: boolean;
  depositTerms: BigNumber[];
  depositTokens: IToken[];
  loanPairs: ILoanPair[];
  protocolContractAddress?: string;
  distributorConfig?: IDistributorConfig;
}

const initState: ICommonState = {
  currentNetwork: undefined,
  isUserActionsLocked: true,
  depositTerms: [],
  depositTokens: [],
  loanPairs: [],
  protocolContractAddress: undefined,
  distributorConfig: undefined,
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
    case CommonActionType.SetTokenPrice:
      const {
        loanTokenAddress,
        loanTokenPrice,
        collateralTokenAddress,
        collateralTokenPrice,
      } = action.payload;
      return {
        ...state,
        loanPairs: state.loanPairs.map(pair => {
          if (
            pair.loanToken.tokenAddress === loanTokenAddress &&
            pair.collateralToken.tokenAddress === collateralTokenAddress
          ) {
            return {
              ...pair,
              loanToken: { ...pair.loanToken, price: loanTokenPrice },
              collateralToken: {
                ...pair.collateralToken,
                price: collateralTokenPrice,
              },
            };
          }
          return pair;
        }),
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
          token.tokenAddress === action.payload.tokenAddress
            ? { ...token, allowance: action.payload.allowanceAmount }
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
    case CommonActionType.SetDistributorConfig:
      return {
        ...state,
        distributorConfig: action.payload.distributorConfig,
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

  static setAllowance(tokenAddress: string, allowanceAmount: BigNumber) {
    return {
      type: CommonActionType.SetAllowance,
      payload: {
        tokenAddress,
        allowanceAmount,
      },
    };
  }

  static setTokenPrice(
    loanTokenAddress: string,
    loanPrice: BigNumber,
    collateralTokenAddress: string,
    collateralTokenPrice: BigNumber,
  ) {
    return {
      type: CommonActionType.SetTokenPrice,
      payload: {
        loanTokenAddress,
        loanPrice,
        collateralTokenAddress,
        collateralTokenPrice,
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

  static setDistributorConfig(distributorConfig: IDistributorConfig) {
    return {
      type: CommonActionType.SetDistributorConfig,
      payload: {
        distributorConfig,
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

export const useDistributorConfig = () =>
  useSelector<IState, IDistributorConfig>(
    state => state.common.distributorConfig,
  );
