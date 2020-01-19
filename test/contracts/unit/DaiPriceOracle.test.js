const DaiPriceOracle = artifacts.require('DaiPriceOracle');
const Medianizer = artifacts.require('MedianizerMock');
const OasisDex = artifacts.require('OasisDexMock');
const { toFixedBN, createERC20Token } = require('../../utils/index');
const { BN, time, expectEvent } = require('openzeppelin-test-helpers');
const { expect } = require('chai');

contract('DaiPriceOracle', function([owner]) {
  let priceOracle, weth, dai, medianizer, oasisDex, uniswap, ethPrice;
  const priceUpperBound = 1.1;
  const priceLowerBound = 0.9;

  beforeEach(async () => {
    weth = await createERC20Token(owner);
    dai = await createERC20Token(owner);
    medianizer = await Medianizer.new();
    oasisDex = await OasisDex.new();
    uniswap = await web3.eth.accounts.create();
    const oasisEthAmount = toFixedBN(10);
    ethPrice = toFixedBN(200);
    await medianizer.setPrice(ethPrice);
    await oasisDex.setEthPrice(ethPrice);

    priceOracle = await DaiPriceOracle.new(
      weth.address,
      dai.address,
      medianizer.address,
      oasisDex.address,
      uniswap.address,
      oasisEthAmount,
      toFixedBN(priceUpperBound),
      toFixedBN(priceLowerBound),
    );
  });

  const setUniswapPrice = async price => {
    const uniswapPrice = toFixedBN(price);
    const uniswapEthAmount = new BN(1);
    const uniswapDaiAmount = ethPrice.mul(uniswapEthAmount).div(uniswapPrice);

    await web3.eth.sendTransaction({
      from: owner,
      to: uniswap.address,
      value: uniswapEthAmount,
    });

    await dai.mint(uniswap.address, uniswapDaiAmount);
  };

  describe('#getPrice', () => {
    context('before price update', () => {
      it('succeeds', async () => {
        const expectedPrice = toFixedBN(1);
        const actualPrice = await priceOracle.getPrice();
        expect(actualPrice).to.be.bignumber.equal(expectedPrice);
      });
    });

    context('when oasis price is the mid price', () => {
      it('succeeds', async () => {
        await setUniswapPrice(0.9);

        await oasisDex.setBuyAmount(ethPrice.mul(new BN(10)));
        await oasisDex.setPayAmount(ethPrice.mul(new BN(11)));

        const oasisPrice = await priceOracle.getOasisPrice(ethPrice);

        await time.increase(time.duration.hours(2));
        const { logs } = await priceOracle.updatePriceIfNeeded();
        expectEvent.inLogs(logs, 'PriceUpdated');

        const actualPrice = await priceOracle.getPrice();
        expect(actualPrice).to.be.bignumber.equal(oasisPrice);
      });
    });

    context('when uniswap price is the mid price', () => {
      it('succeeds', async () => {
        const uniswapPrice = 0.98;
        await setUniswapPrice(uniswapPrice);

        await oasisDex.setBuyAmount(ethPrice.mul(new BN(10)));
        await oasisDex.setPayAmount(ethPrice.mul(new BN(11)));

        await time.increase(time.duration.hours(2));
        const { logs } = await priceOracle.updatePriceIfNeeded();
        expectEvent.inLogs(logs, 'PriceUpdated');

        const actualPrice = await priceOracle.getPrice();
        expect(actualPrice).to.be.bignumber.closeTo(
          toFixedBN(uniswapPrice),
          toFixedBN(0.001),
        );
      });
    });

    context('when expected price is the mid price', () => {
      it('succeeds', async () => {
        const uniswapPrice = 1.2;
        await setUniswapPrice(uniswapPrice);

        await oasisDex.setBuyAmount(ethPrice.mul(new BN(10)));
        await oasisDex.setPayAmount(ethPrice.mul(new BN(11)));

        await time.increase(time.duration.hours(2));
        const { logs } = await priceOracle.updatePriceIfNeeded();
        expectEvent.inLogs(logs, 'PriceUpdated');

        const actualPrice = await priceOracle.getPrice();
        expect(actualPrice).to.be.bignumber.equal(toFixedBN(1));
      });
    });

    context('when price diff is too small', () => {
      it('does not update price', async () => {
        const uniswapPrice = 0.99;
        await setUniswapPrice(uniswapPrice);

        await oasisDex.setBuyAmount(ethPrice.mul(new BN(10)));
        await oasisDex.setPayAmount(ethPrice.mul(new BN(11)));

        await time.increase(time.duration.hours(2));
        await priceOracle.updatePriceIfNeeded();

        const actualPrice = await priceOracle.getPrice();
        expect(actualPrice).to.be.bignumber.equal(toFixedBN(1));
      });
    });

    context('when price is smaller than lower bound', () => {
      it('does not update price', async () => {
        const uniswapPrice = priceLowerBound - 0.01;
        await setUniswapPrice(uniswapPrice);

        await oasisDex.setBuyAmount(ethPrice.mul(new BN(8)));
        await oasisDex.setPayAmount(ethPrice.mul(new BN(10)));

        await time.increase(time.duration.hours(2));
        await priceOracle.updatePriceIfNeeded();

        const actualPrice = await priceOracle.getPrice();
        expect(actualPrice).to.be.bignumber.equal(toFixedBN(1));
      });
    });

    context('when price is larger than upper bound', () => {
      it('does not update price', async () => {
        const uniswapPrice = priceUpperBound + 0.01;
        await setUniswapPrice(uniswapPrice);

        await oasisDex.setBuyAmount(ethPrice.mul(new BN(13)));
        await oasisDex.setPayAmount(ethPrice.mul(new BN(10)));

        await time.increase(time.duration.hours(2));
        await priceOracle.updatePriceIfNeeded();

        const actualPrice = await priceOracle.getPrice();
        expect(actualPrice).to.be.bignumber.equal(toFixedBN(1));
      });
    });
  });

  describe('#setPriceBoundary', () => {
    it('succeeds', async () => {
      const newPriceUpperBound = toFixedBN(1.2);
      const newPriceLowerBound = toFixedBN(0.8);

      await priceOracle.setPriceBoundary(
        newPriceUpperBound,
        newPriceLowerBound,
      );

      expect(await priceOracle.priceUpperBound()).to.bignumber.equal(
        newPriceUpperBound,
      );
      expect(await priceOracle.priceLowerBound()).to.bignumber.equal(
        newPriceLowerBound,
      );
    });
  });
});
