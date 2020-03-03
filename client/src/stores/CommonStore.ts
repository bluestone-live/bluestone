import { IAction, IState } from '.';
import { Contract } from 'web3-eth-contract';
import { useSelector } from 'react-redux';
import { replaceBy } from '../utils/replaceBy';

const enum CommonActionType {
  SetDepositTokens = 'SET_DEPOSIT_TOKENS',
  SetLoanPairs = 'SET_LOAN_PAIRS',
  SetAllowance = 'SET_ALLOWANCE',
  SetDepositTerms = 'SET_DEPOSIT_TERMS',
  SetMaxLoanTerm = 'SET_LOAN_TERMS',
  SetLoanAPR = 'SET_LOAN_APR',
  SetProtocolContractAddress = 'SET_PROTOCOL_CONTRACT_ADDRESS',
  SetTokenPrice = 'SET_TOKEN_PRICE',
  SetDistributorAddress = 'SET_DISTRIBUTOR_ADDRESS',
  SetInterestModelParameters = 'SET_INTEREST_MODEL_PARAMETERS',
}

export interface IToken {
  tokenAddress: string;
  tokenSymbol: string;
  allowance?: string;
  price?: string;
  erc20Instance?: Contract;
}

export interface ITerm {
  text: string;
  value: number;
}

export interface ILoanPair {
  loanToken: IToken;
  collateralToken: IToken;
  annualPercentageRate?: string;
  maxLoanTerm?: string;
  minCollateralCoverageRatio: string;
}

export interface IInterestModelParameters {
  loanInterestRateUpperBound: string;
  loanInterestRateLowerBound: string;
}

export interface IDistributionFeeRatios {
  depositDistributorFeeRatio: string;
  loanDistributorFeeRatio: string;
}

interface ICommonState {
  depositTerms: string[];
  depositTokens: IToken[];
  loanPairs: ILoanPair[];
  protocolContractAddress?: string;
  distributorAddress?: string;
  interestModelParameters: IInterestModelParameters;
}

const initState: ICommonState = {
  depositTerms: [],
  depositTokens: [],
  loanPairs: [],
  protocolContractAddress: undefined,
  distributorAddress: undefined,
  interestModelParameters: {
    loanInterestRateUpperBound: '0',
    loanInterestRateLowerBound: '0',
  },
};

export const CommonReducer = (
  state: ICommonState = initState,
  action: IAction<CommonActionType>,
) => {
  switch (action.type) {
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
        loanPairs: state.loanPairs.map(pair => {
          if (pair.loanToken.tokenAddress === action.payload.tokenAddress) {
            return {
              ...pair,
              loanToken: {
                ...pair.loanToken,
                allowance: action.payload.allowanceAmount,
              },
            };
          }
          if (
            pair.collateralToken.tokenAddress === action.payload.tokenAddress
          ) {
            return {
              ...pair,
              collateralToken: {
                ...pair.collateralToken,
                allowance: action.payload.allowanceAmount,
              },
            };
          }
          return pair;
        }),
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
    case CommonActionType.SetDistributorAddress:
      return {
        ...state,
        distributorAddress: action.payload.distributorAddress,
      };
    case CommonActionType.SetInterestModelParameters:
      return {
        ...state,
        interestModelParameters: action.payload.interestModelParameters,
      };
    default:
      return state;
  }
};

export class CommonActions {
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

  static setAllowance(tokenAddress: string, allowanceAmount: string) {
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
    loanPrice: string,
    collateralTokenAddress: string,
    collateralTokenPrice: string,
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

  static setDepositTerms(depositTerms: string[]) {
    return {
      type: CommonActionType.SetDepositTerms,
      payload: {
        depositTerms,
      },
    };
  }

  static setMaxLoanTerm(tokenAddress: string, maxLoanTerm: string) {
    return {
      type: CommonActionType.SetMaxLoanTerm,
      payload: {
        tokenAddress,
        maxLoanTerm,
      },
    };
  }

  static setLoanAPR(tokenAddress: string, annualPercentageRate: string) {
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

  static setDistributorAddress(distributorAddress: string) {
    return {
      type: CommonActionType.SetDistributorAddress,
      payload: {
        distributorAddress,
      },
    };
  }

  static setInterestModelParameters(
    interestModelParameters: IInterestModelParameters,
  ) {
    return {
      type: CommonActionType.SetInterestModelParameters,
      payload: {
        interestModelParameters,
      },
    };
  }
}

// Selectors

export const useDepositTokens = () =>
  useSelector<IState, IToken[]>(state => state.common.depositTokens);

// TODO Only for test, hide other terms
export const useTestingDepositTerms = () =>
  useSelector<IState, ITerm[]>(() =>
    ['30', '60', '90']
      .map((bigNumber: string) => ({ value: bigNumber.toString() }))
      .map(({ value }: { value: string }) => ({
        text: `${value}-Day`,
        value: Number.parseInt(value, 10),
      })),
  );

export const useDepositTerms = () =>
  useSelector<IState, ITerm[]>(state =>
    state.common.depositTerms
      .map((bigNumber: string) => ({ value: bigNumber.toString() }))
      .map(({ value }: { value: string }) => ({
        text: `${value}-Day`,
        value: Number.parseInt(value, 10),
      })),
  );

export const useLoanPairs = () =>
  useSelector<IState, ILoanPair[]>(state => state.common.loanPairs);

export const useDistributorAddress = () =>
  useSelector<IState, string>(state => state.common.distributorAddress || {});

export const useInterestModelParameters = () =>
  useSelector<IState, IInterestModelParameters>(
    state => state.common.interestModelParameters,
  );
