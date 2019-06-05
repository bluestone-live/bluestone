import * as React from 'react';
import LoanPrepareForm from '../containers/LoanPrepareForm';

export default class LoanOverviewPage extends React.Component {
  render() {
    const tokenNameList = ['ETH', 'DAI', 'USDC'];

    return (
      <div>
        <h2>Loan Overview</h2>

        {tokenNameList.map((tokenName, id) => (
          <LoanPrepareForm key={id} tokenName={tokenName} />
        ))}
      </div>
    );
  }
}
