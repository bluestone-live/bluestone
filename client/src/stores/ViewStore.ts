import { IAction, IState } from '.';
import { useSelector } from 'react-redux';
import { BannerType } from '../components/Banner';

export enum ViewActionType {
  SetBanner = 'SET_BANNER',
  SetLoading = 'SET_LOADING',
  SetNetwork = 'SET_NETWORK',
}

interface IViewStore {
  loading: boolean;
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
    case ViewActionType.SetLoading:
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

  static setLoading(loading: boolean) {
    return {
      type: ViewActionType.SetLoading,
      payload: {
        actionButtonLoading: loading,
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

export const useLoading = () =>
  useSelector<IState, boolean>(state => state.view.actionButtonLoading);

export const useNetwork = () =>
  useSelector<IState, string>(state => state.view.network);
