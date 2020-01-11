import Loadable from 'react-loadable';
import Loading from '../components/Loading';
import { Overview } from '../layouts';

const routes = [
  {
    name: 'demo',
    path: '/',
    component: Loadable({
      loader: () => import('../pages/Demo'),
      loading: Loading,
    }),
    layout: Overview,
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
    name: 'account',
    path: '/account',
    component: Loadable({
      loader: () => import('../pages/Account'),
      loading: Loading,
    }),
    layout: Overview,
  },
];

export default routes;
