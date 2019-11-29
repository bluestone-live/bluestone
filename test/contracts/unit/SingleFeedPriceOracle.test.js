const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const { BN } = require('openzeppelin-test-helpers');
const { expect } = require('chai');

contract('SingleFeedPriceOracle', function() {
  let priceOracle;

  beforeEach(async () => {
    priceOracle = await SingleFeedPriceOracle.new();
  });

  describe('#setPrice', () => {
    it('succeeds', async () => {
      const expectedPrice = new BN(1);
      await priceOracle.setPrice(expectedPrice);
      const actualPrice = await priceOracle.getPrice();
      expect(actualPrice).to.be.bignumber.equal(expectedPrice);
    });
  });
});
