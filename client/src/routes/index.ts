import Loadable from 'react-loadable';
import Loading from '../components/Loading';

const routes = [
  {
    name: 'deposit-overview',
    path: ['/', '/deposit'],
    component: Loadable({
      loader: () => import('../pages/Overview'),
      loading: Loading,
    }),
  },
  {
    name: 'borrow-overview',
    path: '/borrow',
    component: Loadable({
      loader: () => import('../pages/Overview'),
      loading: Loading,
    }),
  },
  {
    name: 'account',
    path: '/account',
    component: Loadable({
      loader: () => import('../pages/Overview'),
      loading: Loading,
    }),
  },
];

export default routes;
