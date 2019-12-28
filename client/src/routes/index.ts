import Loadable from 'react-loadable';
import Loading from '../components/Loading';

const routes = [
  {
    name: 'demo',
    path: '/',
    component: Loadable({
      loader: () => import('../pages/Demo'),
      loading: Loading,
    }),
  },
  {
    name: 'deposit-overview',
    path: '/deposit',
    component: Loadable({
      loader: () => import('../pages/DepositOverview'),
      loading: Loading,
    }),
  },
  {
    name: 'borrow-overview',
    path: '/borrow',
    component: Loadable({
      loader: () => import('../pages/BorrowOverview'),
      loading: Loading,
    }),
  },
  {
    name: 'account',
    path: '/account',
    component: Loadable({
      loader: () => import('../pages/Account'),
      loading: Loading,
    }),
  },
];

export default routes;
