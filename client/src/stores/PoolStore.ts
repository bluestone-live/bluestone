import { IAction, IState } from '.';
import { useSelector } from 'react-redux';

export enum PoolActionType {
  ReplacePools = 'REPLACE_POOLS',
  ReplacePool = 'REPLACE_POOL',
  ReplaceMonitorPools = 'REPLACE_MONITOR_POOLS',
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
  monitorPoolMap: {
    [tokenAddress: string]: IPool[];
  };
}

const initState: IPoolStore = {
  poolMap: {},
  monitorPoolMap: {},
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
    case PoolActionType.ReplaceMonitorPools:
      return {
        ...state,
        monitorPoolMap: {
          ...state.monitorPoolMap,
          [action.payload.tokenAddress]: action.payload.monitorPools,
        },
      };
    case PoolActionType.ReplacePool:
      return {
        ...state,
        monitorPoolMap: {
          ...state.monitorPoolMap,
          [action.payload.tokenAddress]: (
            state.monitorPoolMap[action.payload.tokenAddress] || []
          ).map(pool => {
            if (
              pool.tokenAddress === action.payload.tokenAddress &&
              pool.poolId === action.payload.poolId
            ) {
              return action.payload.pool;
            }
            return pool;
          }),
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
  static replacePool(tokenAddress: string, poolId: string, pool: IPool) {
    return {
      type: PoolActionType.ReplacePool,
      payload: {
        tokenAddress,
        poolId,
        pool,
      },
    };
  }
  static replaceMonitorPools(tokenAddress: string, monitorPools: IPool[]) {
    return {
      type: PoolActionType.ReplaceMonitorPools,
      payload: {
        tokenAddress,
        monitorPools,
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

export const useMonitorPools = () =>
  useSelector<IState, { [tokenAddress: string]: IPool[] }>(state => {
    return state.pool.monitorPoolMap;
  });
