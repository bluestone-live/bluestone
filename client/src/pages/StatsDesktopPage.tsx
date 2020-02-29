import React from 'react';
import MonitorPage from './MonitorPage';
import MonitorDetailPage from './MonitorDetailPage';
import MintTokenPage from './MintTokenPage';
import { Route } from 'react-router';

const containers = [
  {
    path: '/monitor',
    component: MonitorPage,
  },
  {
    path: '/monitor/:poolId',
    component: MonitorDetailPage,
  },
  {
    path: '/mint',
    component: MintTokenPage,
  },
];

const Page = () => {
  return (
    <div className="stats-desktop-page">
      {containers.map(v => (
        <Route key={v.path} path={v.path} exact component={v.component} />
      ))}
    </div>
  );
};

export default Page;
