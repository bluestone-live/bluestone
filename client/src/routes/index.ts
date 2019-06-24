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
    path: '/deposit',
    component: Loadable({
      loader: () => import('../pages/DepositForm'),
      loading: Loading,
    }),
  },
  {
    name: 'deposit',
    path: '/deposit/:symbol',
    component: Loadable({
      loader: () => import('../pages/DepositForm'),
      loading: Loading,
    }),
  },
  {
    name: 'transaction-list',
    path: '/transactions',
    component: Loadable({
      loader: () => import('../pages/TransactionList'),
      loading: Loading,
    }),
  },
];

export default routes;
