import * as Loadable from 'react-loadable';
import Loading from '../components/common/Loading';

const routes = [
  {
    name: 'index',
    path: '/',
    component: Loadable({
      loader: () => import('../containers/Main'),
      loading: Loading,
    }),
  },
];

export default routes;
