contract('Protocol', () => {
  describe('Loan token by collateral token flow', () => {
    context('Repaid in time', () => {
      it('succeed');
      it('increase the collateral token amount of protocol contract');
      it('decrease the available amount of specific pools');
      it('increase the loan interest of specific pools');
      it('create a new record for user account');
      it('get correct data of record');
      it('add collateral succeed');
      it('get correct data of record');
      it('partially repaid succeed');
      it('get correct data of record');
      it('fully repaid succeed');
      it('subtract correct balance from user account');
      it('transfer correct amount to user account');
      it('closed the record');
      it('increase the loan token amount of protocol contract');
      it('increase the available amount of specific pools');
    });

    context('Below collateral coverage ratio', () => {
      context('Fully liquidate', () => {
        it('can be liquidated after the token price changed');
        it('fully liquidated succeed');
        it('closed the record');
      });

      context('Partial liquidate', () => {
        it('partially liquidated succeed');
        it('get correct collateral coverage ratio after liquidation');
        it('repaid succeed');
        it('closed the record');
        it('get correct data of record');
      });
    });

    context('Overdue', () => {
      context('Fully liquidate', () => {
        it('can be liquidated after the token price changed');
        it('fully liquidated succeed');
        it('closed the record');
      });

      context('Partial liquidate', () => {
        it('partially liquidated succeed');
        it('get correct collateral coverage ratio after liquidation');
        it('repaid succeed');
        it('closed the record');
        it('get correct data of record');
      });
    });
  });
});
