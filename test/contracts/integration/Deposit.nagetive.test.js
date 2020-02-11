contract('Protocol', () => {
  describe('Deposit token flow', () => {
    context("When deposit token didn't enabled", () => {
      it('revert');
    });
    context('When deposit token disabled after deposit', () => {
      it('early withdraw succeed');
      it('withdraw succeed');
      it('revert deposit');
    });
    context("When deposit term didn't enabled", () => {
      it('revert');
    });
    context('When deposit term disabled after deposit', () => {
      it('early withdraw succeed');
      it('withdraw succeed');
      it('revert deposit');
    });
    context('When protocol paused', () => {
      it('revert deposit');
      it('fetch deposit records succeed');
      it('revert early withdraw');
      it('revert withdraw');
    });
  });
});
