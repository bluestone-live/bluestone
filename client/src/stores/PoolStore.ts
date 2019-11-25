import { BigNumber } from '../utils/BigNumber';
import { IAction, IState } from '.';
import { useSelector } from 'react-redux';

export enum PoolActionType {
  ReplacePools = 'REPLACE_POOLS',
}

export interface IPool {
  poolIndex: number;
  depositAmount: BigNumber;
  availableAmount: BigNumber;
  loanInterest: BigNumber;
  totalDepositWeight: BigNumber;
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

export class PoolAction {
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
