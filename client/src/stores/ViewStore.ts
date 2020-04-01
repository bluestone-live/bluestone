import { IAction, IState } from '.';
import { useSelector } from 'react-redux';
import { BannerType } from '../components/Banner';

export enum LoadingType {
  Approve = 'approve',
  Deposit = 'deposit',
  Withdraw = 'withdraw',
  Borrow = 'borrow',
  AddCollateral = 'add_collateral',
  Repay = 'repay',
  Mint = 'mint',
  None = 'default',
}

export enum ViewActionType {
  SetBanner = 'SET_BANNER',
  SetLoadingType = 'SET_LOADING_TYPE',
  SetNetwork = 'SET_NETWORK',
}

interface IViewStore {
  loading: boolean;
  loadingType?: LoadingType;
  banner?: string;
  bannerType: BannerType;
  bannerModalContent?: string;
  network: string;
}

const initState: IViewStore = {
  loading: false,
  bannerType: BannerType.Success,
  network: 'primary',
};

export const ViewReducer = (
  state: IViewStore = initState,
  action: IAction<ViewActionType>,
) => {
  switch (action.type) {
    case ViewActionType.SetBanner:
      return {
        ...state,
        ...action.payload,
      };
    case ViewActionType.SetLoadingType:
      return {
        ...state,
        ...action.payload,
      };
    case ViewActionType.SetNetwork:
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};

export class ViewActions {
  static setBanner(
    banner: string,
    bannerType: BannerType = BannerType.Success,
    bannerModalContent?: string,
  ) {
    return {
      type: ViewActionType.SetBanner,
      payload: {
        banner,
        bannerType,
        bannerModalContent,
      },
    };
  }

  static removeBanner() {
    return {
      type: ViewActionType.SetBanner,
      payload: {
        banner: undefined,
      },
    };
  }

  static setLoadingType(loadingType: LoadingType) {
    return {
      type: ViewActionType.SetLoadingType,
      payload: {
        loadingType,
      },
    };
  }

  static setNetwork(network: string) {
    return {
      type: ViewActionType.SetNetwork,
      payload: {
        network,
      },
    };
  }
}

export const useBanner = () =>
  useSelector<
    IState,
    { banner: string; bannerType: BannerType; bannerModalContent: string }
  >(state => {
    return {
      banner: state.view.banner,
      bannerType: state.view.bannerType,
      bannerModalContent: state.view.bannerModalContent,
    };
  });

export const useLoadingType = () =>
  useSelector<IState, LoadingType>(
    state => state.view.loadingType || LoadingType.None,
  );

export const useNetwork = () =>
  useSelector<IState, string>(state => state.view.network);
