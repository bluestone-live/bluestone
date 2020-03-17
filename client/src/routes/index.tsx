import React from 'react';
import Loadable from 'react-loadable';
import Loading from '../components/Loading';
import { Overview, Desktop, Default } from '../layouts';
import { Redirect } from 'react-router';

const routes = (isMobile = true) => {
  return [
    {
      name: 'root',
      path: '/',
      component: () => <Redirect to="/account" />,
    },
    {
      name: 'deposit-overview',
      path: '/deposit',
      component: Loadable({
        loader: () =>
          import(
            isMobile
              ? '../pages/DepositOverview'
              : '../pages/DepositDesktopPage'
          ),
        loading: Loading,
      }),
      layout: isMobile ? Overview : Desktop,
      title: isMobile ? undefined : 'route_title_deposit',
    },
    {
      name: 'deposit-form',
      path: '/deposit/:poolId',
      component: Loadable({
        loader: () =>
          import(
            isMobile
              ? '../pages/DepositFormPage'
              : '../pages/DepositDesktopPage'
          ),
        loading: Loading,
      }),
      layout: isMobile ? Default : Desktop,
      title: 'route_title_confirm',
    },
    {
      name: 'borrow-overview',
      path: '/borrow',
      component: Loadable({
        loader: () =>
          import(
            isMobile ? '../pages/BorrowOverview' : '../pages/DepositDesktopPage'
          ),
        loading: Loading,
      }),
      layout: isMobile ? Overview : Desktop,
      title: isMobile ? undefined : 'route_title_borrow',
    },
    {
      name: 'borrow-form',
      path: '/borrow/:poolId',
      component: Loadable({
        loader: () =>
          import(
            isMobile ? '../pages/BorrowFormPage' : '../pages/DepositDesktopPage'
          ),
        loading: Loading,
      }),
      title: 'route_title_confirm',
      layout: isMobile ? Default : Desktop,
    },
    {
      name: 'account',
      path: '/account',
      component: Loadable({
        loader: () =>
          import(
            isMobile
              ? '../pages/AccountOverview'
              : '../pages/DepositDesktopPage'
          ),
        loading: Loading,
      }),
      layout: isMobile ? Overview : Desktop,
      title: isMobile ? undefined : 'route_title_account',
    },
    {
      name: 'deposit-detail',
      path: '/account/deposit/:recordId',
      component: Loadable({
        loader: () =>
          import(
            isMobile
              ? '../pages/DepositDetailPage'
              : '../pages/DepositDesktopPage'
          ),
        loading: Loading,
      }),
      title: 'route_title_deposit_detail',
      layout: isMobile ? Default : Desktop,
    },
    {
      name: 'loan-detail',
      path: '/account/borrow/:recordId',
      component: Loadable({
        loader: () =>
          import(
            isMobile
              ? '../pages/BorrowDetailPage'
              : '../pages/DepositDesktopPage'
          ),
        loading: Loading,
      }),
      title: 'route_title_borrow_detail',
      layout: isMobile ? Default : Desktop,
    },
    {
      name: 'add-collateral-form',
      path: '/borrow/:recordId/add-collateral',
      component: Loadable({
        loader: () =>
          import(
            isMobile
              ? '../pages/AddCollateralFormPage'
              : '../pages/DepositDesktopPage'
          ),
        loading: Loading,
      }),
      title: 'route_title_add_collateral',
      layout: isMobile ? Default : Desktop,
    },
    {
      name: 'repay-form',
      path: '/borrow/:recordId/repay',
      component: Loadable({
        loader: () =>
          import(
            isMobile ? '../pages/RepayFormPage' : '../pages/DepositDesktopPage'
          ),
        loading: Loading,
      }),
      title: 'route_title_repay',
      layout: isMobile ? Default : Desktop,
    },
    {
      name: 'monitor',
      path: '/monitor',
      component: Loadable({
        loader: () =>
          import(
            isMobile ? '../pages/MonitorPage' : '../pages/StatsDesktopPage'
          ),
        loading: Loading,
      }),
      title: 'route_title_monitor',
      layout: isMobile ? Default : Desktop,
    },
    {
      name: 'monitor-detail',
      path: '/monitor/:poolId',
      component: Loadable({
        loader: () =>
          import(
            isMobile
              ? '../pages/MonitorDetailPage'
              : '../pages/StatsDesktopPage'
          ),
        loading: Loading,
      }),
      title: 'route_title_monitor_detail',
      layout: isMobile ? Default : Desktop,
    },
    {
      name: 'mint',
      path: '/mint',
      component: Loadable({
        loader: () =>
          import(
            isMobile ? '../pages/MintTokenPage' : '../pages/StatsDesktopPage'
          ),
        loading: Loading,
      }),
      title: 'route_title_mint_token',
      layout: isMobile ? Default : Desktop,
    },
  ];
};

export default routes;
