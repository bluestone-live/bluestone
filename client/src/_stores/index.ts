import { combineReducers, createStore } from 'redux';
import { AccountReducer } from './AccountStore';
import { CommonReducer } from './CommonStore';

export interface IAction<T> {
  type: T;
  payload: any;
}

const reducers = combineReducers({
  account: AccountReducer,
  common: CommonReducer,
});

export const store = createStore(reducers);

export type IState = ReturnType<typeof reducers>;

export * from './AccountStore';
export * from './CommonStore';
