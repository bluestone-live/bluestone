import Loadable from 'react-loadable';
import Loading from '../components/common/Loading';

const routes = [
  {
    name: 'index',
    path: '/',
    component: Loadable({
      loader: () => import('../pages/FrontPage'),
      loading: Loading,
    }),
  },
  {
    name: 'account-manager',
    path: '/account',
    component: Loadable({
      loader: () => import('../pages/AccountManagerPage'),
      loading: Loading,
    }),
  },
  {
    name: 'deposit-assets',
    path: '/deposit-assets',
    component: Loadable({
      loader: () => import('../pages/DepositAssetsPage'),
      loading: Loading,
    }),
  },
  {
    name: 'loan-assets',
    path: '/loan-assets',
    component: Loadable({
      loader: () => import('../pages/LoanAssetsPage'),
      loading: Loading,
    }),
  },
  {
    name: 'loan',
    path: '/loan',
    component: Loadable({
      loader: () => import('../pages/LoanPage'),
      loading: Loading,
    }),
  },
  {
    name: 'deposit',
    path: ['/deposit', '/deposit/:tokenSymbol'],
    component: Loadable({
      loader: () => import('../pages/DepositPage'),
      loading: Loading,
    }),
  },
  {
    name: 'withdraw-freed-collateral',
    path: '/withdraw/:tokenAddress',
    component: Loadable({
      loader: () => import('../pages/WithdrawFreedCollateralPage'),
      loading: Loading,
    }),
  },
  {
    name: 'loan-add-collateral',
    path: '/loan/collateral/add/:recordAddress',
    component: Loadable({
      loader: () => import('../pages/AddCollateralPage'),
      loading: Loading,
    }),
  },
  {
    name: 'loan-withdraw-collateral',
    path: '/loan/collateral/withdraw/:recordAddress',
    component: Loadable({
      loader: () => import('../pages/WithdrawFreedCollateralPage'),
      loading: Loading,
    }),
  },
  {
    name: 'loan-repay',
    path: '/loan/repay/:recordAddress',
    component: Loadable({
      loader: () => import('../pages/RepayPage'),
      loading: Loading,
    }),
  },
  {
    name: 'record-page',
    path: [
      '/records',
      '/records/:recordType',
      '/records/:recordType/:recordAddress',
    ],
    component: Loadable({
      loader: () => import('../pages/RecordPage'),
      loading: Loading,
    }),
  },
];

export default routes;
