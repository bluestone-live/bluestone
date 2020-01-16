import { IAction, IState } from '.';
import { useSelector } from 'react-redux';

export enum PoolActionType {
  ReplacePools = 'REPLACE_POOLS',
}

export interface IPool {
  term: number;
  APR: string;
  utilization: string;
  poolId: string;
  totalDeposit: string;
  availableAmount: string;
  loanInterest: string;
  totalDepositWeight: string;
  tokenAddress: string;
}

export interface IComputedPool {
  poolId: string;
  term: number;
  availableAmount: number;
  loanInterestRate: number;
}

interface IPoolStore {
  poolMap: {
    [tokenAddress: string]: IPool[];
  };
}

const initState: IPoolStore = {
  poolMap: {},
};

export const PoolReducer = (
  state: IPoolStore = initState,
  action: IAction<PoolActionType>,
) => {
  switch (action.type) {
    case PoolActionType.ReplacePools:
      return {
        ...state,
        poolMap: {
          ...state.poolMap,
          [action.payload.tokenAddress]: action.payload.pools,
        },
      };
    default:
      return state;
  }
};

export class PoolActions {
  static replacePools(tokenAddress: string, pools: IPool[]) {
    return {
      type: PoolActionType.ReplacePools,
      payload: {
        tokenAddress,
        pools,
      },
    };
  }
}

export const usePools = () =>
  useSelector<IState, { [tokenAddress: string]: IPool[] }>(state => {
    return state.pool.poolMap;
  });

export const useAllPools = () =>
  useSelector<IState, IPool[]>(state => {
    return Object.keys(state.pool.poolMap).reduce(
      (allPools: IPool[], key: string) => [
        ...allPools,
        ...state.pool.poolMap[key],
      ],
      [],
    );
  });
