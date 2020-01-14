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
    path: '/account/loan/:recordId',
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
];

export default routes;
