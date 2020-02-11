contract('Protocol', () => {
  describe('Loan token by collateral token flow', () => {
    context("When loan pair didn't enabled", () => {
      it('revert');
    });
    context('When loan pair disabled after loan', () => {
      it('revert add collateral');
      it('repay succeed');
      it('revert loan');
    });
    context('When max loan term changed', () => {
      it('add collateral succeed');
      it('repay succeed');
    });
  });

  describe('Loan token by collateral ETH flow', () => {
    context("When loan pair didn't enabled", () => {
      it('revert');
    });
    context('When loan pair disabled after loan', () => {
      it('revert add collateral');
      it('repay succeed');
      it('revert loan');
    });
    context('When max loan term changed', () => {
      it('add collateral succeed');
      it('repay succeed');
    });
  });
});
