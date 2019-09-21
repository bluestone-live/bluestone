const PriceOracle = artifacts.require('_PriceOracle');
const { createERC20Token, toFixedBN } = require('../../utils/index.js');
const { expect } = require('chai');

contract('_PriceOracle', function([owner, account]) {
  let priceOracle, ETH, DAI, USDT;

  beforeEach(async () => {
    priceOracle = await PriceOracle.new();
    ETH = await createERC20Token(account);
    DAI = await createERC20Token(account);
    USDT = await createERC20Token(account);
  });

  describe('#setPrice', () => {
    const price = toFixedBN(5);

    it('succeeds', async () => {
      await priceOracle.setPrice(ETH.address, price, { from: owner });

      expect(await priceOracle.getPrice(ETH.address)).to.be.bignumber.equal(
        price,
      );
    });
  });

  describe('#setPrices', () => {
    it('succeeds', async () => {
      const tokenAddressList = [ETH.address, DAI.address, USDT.address];
      const priceList = [1, 2, 3];

      await priceOracle.setPrices(tokenAddressList, priceList, { from: owner });

      expect(await priceOracle.getPrice(ETH.address)).to.be.bignumber.equal(
        '1',
      );
      expect(await priceOracle.getPrice(DAI.address)).to.be.bignumber.equal(
        '2',
      );
      expect(await priceOracle.getPrice(USDT.address)).to.be.bignumber.equal(
        '3',
      );
    });
  });
});
