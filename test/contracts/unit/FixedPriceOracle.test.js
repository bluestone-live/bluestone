const FixedPriceOracle = artifacts.require('FixedPriceOracle');
const { BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract('FixedPriceOracle', function() {
  describe('#getPrice', () => {
    it('succeeds', async () => {
      const expectedPrice = new BN(1);
      const priceOracle = await FixedPriceOracle.new(expectedPrice);
      const actualPrice = await priceOracle.getPrice();

      expect(actualPrice).to.be.bignumber.equal(expectedPrice);
    });
  });
});
