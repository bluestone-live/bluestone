const PriceOracle = artifacts.require('PriceOracle');
const deployTokens = require('../../scripts/javascript/deployTokens.js');
const postTokenPrices = require('../../scripts/javascript/postTokenPrices.js');
const { getTokenAddress } = require('../../scripts/javascript/utils.js');
const { expect } = require('chai');

describe('script: postTokenPrices', () => {
  contract('PriceOracle', () => {
    let priceOracle;
    const cb = () => {};
    const network = 'development';

    before(async () => {
      priceOracle = await PriceOracle.deployed();
      await deployTokens(cb, network);
    });

    it('updates prices for each token', async () => {
      const ETH = await getTokenAddress('ETH');
      const DAI = await getTokenAddress('DAI');
      const USDT = await getTokenAddress('USDT');
      const [priceETH, priceDAI, priceUSDT] = await postTokenPrices(
        cb,
        network,
      );

      expect(await priceOracle.getPrice(ETH)).to.be.bignumber.equal(priceETH);
      expect(await priceOracle.getPrice(DAI)).to.be.bignumber.equal(priceDAI);
      expect(await priceOracle.getPrice(USDT)).to.be.bignumber.equal(priceUSDT);
    });
  });
});
