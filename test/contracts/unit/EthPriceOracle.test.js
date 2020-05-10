const EthPriceOracle = artifacts.require('EthPriceOracle');
const Medianizer = artifacts.require('MedianizerMock');
const { BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract('EthPriceOracle', function() {
  let priceOracle, medianizer;

  beforeEach(async () => {
    medianizer = await Medianizer.new();
    priceOracle = await EthPriceOracle.new(medianizer.address);
  });

  describe('#getPrice', () => {
    it('succeeds', async () => {
      const expectedPrice = new BN(1);
      await medianizer.setPrice(expectedPrice);
      const actualPrice = await priceOracle.getPrice();
      expect(actualPrice).to.be.bignumber.equal(expectedPrice);
    });
  });
});
