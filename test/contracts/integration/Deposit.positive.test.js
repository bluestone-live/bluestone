contract('Protocol', () => {
  describe('Deposit tokens flow', () => {
    it('succeed');
    it('increase the token amount of protocol contract');
    it('increase the deposit amount of specific pool');
    it('increase the available amount of loan terms');
    it('create a new record for user account');

    context('When nobody loan', () => {
      it('can be early withdraw');
      it('early withdrew succeed');
      it('transfer correct amount to user account');
    });

    context('When somebody loaned', () => {
      it('can be early withdraw');
      it('can get correct interest');
      it('can be early withdraw after loan repaid');
      it('transfer principal to user account after early withdraw');
      it('matured after the date increased');
      it('withdrew succeed');
      it('transfer correct amount to user account');
    });
  });

  describe('Deposit ETH flow', () => {
    it('succeed');
    it('increase WETH amount of protocol contract');
    it('increase the deposit amount of specific pool');
    it('increase the available amount of loan terms');
    it('create a new record for user account');

    context('When nobody loan', () => {
      it('can be early withdraw');
      it('early withdrew succeed');
      it('transfer correct amount to user account');
    });

    // We didn't support loan ETH so we don't need to test those cases about ETH be loaned
  });
});
