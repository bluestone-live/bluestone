import * as React from 'react';
import LoanPrepareForm from '../containers/LoanPrepareForm';

export default class LoanOverviewPage extends React.Component {
  render() {
    const tokenSymbolList = ['ETH', 'DAI', 'USDC'];

    return (
      <div>
        <h2>Loan Overview</h2>

        {tokenSymbolList.map((tokenSymbol, id) => (
          <LoanPrepareForm key={id} tokenSymbol={tokenSymbol} />
        ))}
      </div>
    );
  }
}
