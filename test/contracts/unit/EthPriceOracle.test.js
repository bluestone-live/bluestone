const EthPriceOracle = artifacts.require('EthPriceOracle');
const ChainlinkMock = artifacts.require('ChainlinkMock');
const { BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract('EthPriceOracle', function () {
  let priceOracle, chainlink;

  beforeEach(async () => {
    chainlink = await ChainlinkMock.new();
    priceOracle = await EthPriceOracle.new(chainlink.address);
  });

  describe('#getPrice', () => {
    it('succeeds', async () => {
      const expectedPrice = new BN(1);
      await chainlink.setPrice(expectedPrice);
      const actualPrice = await priceOracle.getPrice();
      expect(actualPrice).to.be.bignumber.equal(expectedPrice);
    });
  });
});
