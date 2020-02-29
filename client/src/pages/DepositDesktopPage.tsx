import React from 'react';
import { Route } from 'react-router';
import DepositOverview from './DepositOverview';
import DepositForm from './DepositFormPage';
import DepositDetail from './DepositDetailPage';
import BorrowOverview from './BorrowOverview';
import BorrowDetail from './BorrowDetailPage';
import BorrowForm from './BorrowFormPage';
import AccountOverview from './AccountOverview';
import AddCollateralForm from './AddCollateralFormPage';
import RepayFormPage from './RepayFormPage';
import Placeholder from '../components/Placeholder';

const details = [
  {
    path: '/deposit/:poolId',
    component: DepositForm,
  },
  {
    path: '/borrow/:poolId',
    component: BorrowForm,
  },
  {
    path: '/account/deposit/:recordId',
    component: DepositDetail,
  },
  {
    path: '/account/borrow/:recordId',
    component: BorrowDetail,
  },
  {
    path: '/borrow/:recordId/add-collateral',
    component: AddCollateralForm,
  },
  {
    path: '/borrow/:recordId/repay',
    component: RepayFormPage,
  },
];

const Page = () => {
  return (
    <div className="deposit-desktop-page">
      <div className="overview">
        <Route path="/deposit" component={DepositOverview} />
        <Route path="/borrow" component={BorrowOverview} />
        <Route path="/account" component={AccountOverview} />
      </div>

      <div className="separator">
        <div className="line" />
      </div>

      <div className="details">
        <Placeholder />

        {details.map(d => (
          <Route key={d.path} path={d.path} exact component={d.component} />
        ))}
      </div>
    </div>
  );
};

export default Page;
