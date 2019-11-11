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
    name: 'deposit-overview',
    path: '/deposit-overview',
    component: Loadable({
      loader: () => import('../pages/DepositOverviewPage'),
      loading: Loading,
    }),
  },
  {
    name: 'loan-overview',
    path: '/loan-overview',
    component: Loadable({
      loader: () => import('../pages/LoanOverviewPage'),
      loading: Loading,
    }),
  },
  {
    name: 'loan',
    path: '/loan',
    component: Loadable({
      loader: () => import('../pages/LoanFormPage'),
      loading: Loading,
    }),
  },
  {
    name: 'deposit',
    path: ['/deposit', '/deposit/:tokenSymbol'],
    component: Loadable({
      loader: () => import('../pages/DepositFormPage'),
      loading: Loading,
    }),
  },
  {
    name: 'withdraw-available-collateral',
    path: '/withdraw/:tokenAddress',
    component: Loadable({
      loader: () => import('../pages/WithdrawAvailableCollateralPage'),
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
      loader: () => import('../pages/WithdrawAvailableCollateralPage'),
      loading: Loading,
    }),
  },
  {
    name: 'loan-repay',
    path: '/loan/repay/:recordAddress',
    component: Loadable({
      loader: () => import('../pages/RepayLoanPage'),
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
