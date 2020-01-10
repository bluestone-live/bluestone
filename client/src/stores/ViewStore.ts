import { IAction, IState } from '.';
import { useSelector } from 'react-redux';
import { BannerType } from '../components/Banner';

export enum ViewActionType {
  SetBanner = 'SET_BANNER',
  SetLoading = 'SET_LOADING',
}

interface IViewStore {
  loading: boolean;
  banner?: string;
  bannerType: BannerType;
}

const initState: IViewStore = {
  loading: false,
  banner: undefined,
  bannerType: BannerType.Success,
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
    default:
      return state;
  }
};

export class ViewAction {
  static setBanner(
    banner?: string,
    bannerType: BannerType = BannerType.Success,
  ) {
    return {
      type: ViewActionType.SetBanner,
      payload: {
        banner,
        bannerType,
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
}

export const useBanner = () =>
  useSelector<IState, { banner: string; bannerType: BannerType }>(state => {
    return { banner: state.view.banner, bannerType: state.view.bannerType };
  });

export const useLoading = () =>
  useSelector<IState, boolean>(state => state.view.actionButtonLoading);
