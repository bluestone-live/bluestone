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
      loader: () => import('../pages/LoanOverviewPage'),
      loading: Loading,
    }),
  },
];

export default routes;
