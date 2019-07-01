import Loadable from 'react-loadable';
import Loading from '../components/common/Loading';

const routes = [
  {
    name: 'index',
    path: '/',
    private: true,
    component: Loadable({
      loader: () => import('../pages/HomePage'),
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
    name: 'transaction-list',
    path: '/transactions',
    component: Loadable({
      loader: () => import('../pages/TransactionListPage'),
      loading: Loading,
    }),
  },
  {
    name: 'deposit-withdraw',
    path: '/deposit/withdraw/:transactionId',
    component: Loadable({
      loader: () => import('../pages/WithdrawDepositPage'),
      loading: Loading,
    }),
  },
  {
    name: 'loan-add-collateral',
    path: '/loan/collateral/add/:transactionId',
    component: Loadable({
      loader: () => import('../pages/AddCollateralPage'),
      loading: Loading,
    }),
  },
  {
    name: 'loan-withdraw-collateral',
    path: '/loan/collateral/withdraw/:transactionId',
    component: Loadable({
      loader: () => import('../pages/WithdrawCollateralPage'),
      loading: Loading,
    }),
  },
  {
    name: 'loan-repay',
    path: '/loan/repay/:transactionId',
    component: Loadable({
      loader: () => import('../pages/RepayPage'),
      loading: Loading,
    }),
  },
  {
    name: 'action-logs',
    path: '/action-logs',
    component: Loadable({
      loader: () => import('../pages/ActionLogsPage'),
      loading: Loading,
    }),
  },
];

export default routes;
