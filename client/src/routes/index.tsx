import React from 'react';
import Loadable from 'react-loadable';
import Loading from '../components/Loading';
import { Overview } from '../layouts';
import { Redirect } from 'react-router';

const routes = [
  {
    name: 'root',
    path: '/',
    component: () => <Redirect to="/deposit" />,
  },
  {
    name: 'deposit-overview',
    path: '/deposit',
    component: Loadable({
      loader: () => import('../pages/DepositOverview'),
      loading: Loading,
    }),
    layout: Overview,
  },
  {
    name: 'deposit-form',
    path: '/deposit/:poolId',
    component: Loadable({
      loader: () => import('../pages/DepositFormPage'),
      loading: Loading,
    }),
    title: 'route_title_confirm',
  },
  {
    name: 'borrow-overview',
    path: '/borrow',
    component: Loadable({
      loader: () => import('../pages/BorrowOverview'),
      loading: Loading,
    }),
    layout: Overview,
  },
  {
    name: 'borrow-form',
    path: '/borrow/:poolId',
    component: Loadable({
      loader: () => import('../pages/BorrowFormPage'),
      loading: Loading,
    }),
    title: 'route_title_confirm',
  },
  {
    name: 'account',
    path: '/account',
    component: Loadable({
      loader: () => import('../pages/AccountOverview'),
      loading: Loading,
    }),
    layout: Overview,
  },
  {
    name: 'deposit-detail',
    path: '/account/deposit/:recordId',
    component: Loadable({
      loader: () => import('../pages/DepositDetailPage'),
      loading: Loading,
    }),
    title: 'route_title_deposit_detail',
  },
  {
    name: 'loan-detail',
    path: '/account/borrow/:recordId',
    component: Loadable({
      loader: () => import('../pages/BorrowDetailPage'),
      loading: Loading,
    }),
    title: 'route_title_borrow_detail',
  },
  {
    name: 'add-collateral-form',
    path: '/borrow/:recordId/add-collateral',
    component: Loadable({
      loader: () => import('../pages/AddCollateralFormPage'),
      loading: Loading,
    }),
    title: 'route_title_add_collateral',
  },
  {
    name: 'repay-form',
    path: '/borrow/:recordId/repay',
    component: Loadable({
      loader: () => import('../pages/RepayFormPage'),
      loading: Loading,
    }),
    title: 'route_title_repay',
  },
  {
    name: 'monitor',
    path: '/monitor',
    component: Loadable({
      loader: () => import('../pages/MonitorPage'),
      loading: Loading,
    }),
    title: 'route_title_monitor',
  },
  {
    name: 'monitor-detail',
    path: '/monitor/:poolId',
    component: Loadable({
      loader: () => import('../pages/MonitorDetailPage'),
      loading: Loading,
    }),
    title: 'route_title_monitor_detail',
  },
  {
    name: 'mint',
    path: '/mint',
    component: Loadable({
      loader: () => import('../pages/MintTokenPage'),
      loading: Loading,
    }),
    title: 'route_title_mint_token',
  },
];

export default routes;
