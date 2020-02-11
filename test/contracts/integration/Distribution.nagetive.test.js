contract('Protocol', () => {
  describe('Deposit flow', () => {
    context('When distributor address is invalid', () => {
      it('revert deposit');
    });
    context("When distribution ratio didn't set", () => {
      it('revert deposit');
    });
    context('When distribution ratio changed', () => {
      it('early withdraw succeed');
      it("didn't transfer token to distributors");
      it('withdraw succeed');
      it('transfer correct token to distributors');
    });
  });
});
