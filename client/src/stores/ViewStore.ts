import { IAction, IState } from '.';
import { useSelector } from 'react-redux';
import { BannerType } from '../components/Banner';

export enum ViewActionType {
  SetBanner = 'SET_BANNER',
}

interface IViewStore {
  banner?: string;
  bannerType: BannerType;
}

const initState: IViewStore = {
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
}

export const useBanner = () =>
  useSelector<IState, { banner: string; bannerType: BannerType }>(state => {
    return { banner: state.view.banner, bannerType: state.view.bannerType };
  });
