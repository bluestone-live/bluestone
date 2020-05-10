const DaiPriceOracle = artifacts.require('DaiPriceOracle');
const Medianizer = artifacts.require('MedianizerMock');
const OasisDex = artifacts.require('OasisDexMock');
const { toFixedBN, createERC20Token } = require('../../utils/index');
const {
  BN,
  time,
  expectEvent,
  expectRevert,
} = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract('DaiPriceOracle', function([owner]) {
  let priceOracle, weth, dai, medianizer, oasisDex, uniswap;
  const priceUpperBound = 1.1;
  const priceLowerBound = 0.9;
  const ethPrice = toFixedBN(200);
  const oasisEthAmount = toFixedBN(10);

  beforeEach(async () => {
    weth = await createERC20Token(owner);
    dai = await createERC20Token(owner);
    medianizer = await Medianizer.new();
    oasisDex = await OasisDex.new();
    uniswap = await web3.eth.accounts.create();
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

        const tx = await priceOracle.getOasisPrice(ethPrice);
        const { oasisPrice } = tx.logs[0].args;

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
        await priceOracle.updatePriceIfNeeded();

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

  describe('#getOasisPrice', () => {
    context('when buy amount and pay amount are valid', () => {
      it('returns oasis price', async () => {
        const buyAmount = ethPrice.mul(new BN(10));
        const payAmount = ethPrice.mul(new BN(11));

        await oasisDex.setBuyAmount(buyAmount);
        await oasisDex.setPayAmount(payAmount);

        const num = oasisEthAmount
          .mul(payAmount)
          .add(oasisEthAmount.mul(buyAmount));
        const den = buyAmount.mul(payAmount).mul(new BN(2));
        const expectedPrice = ethPrice.mul(num).div(den);

        const { logs } = await priceOracle.getOasisPrice(ethPrice);

        expectEvent.inLogs(logs, 'GetOasisPriceSucceed', {
          oasisPrice: expectedPrice,
        });
      });
    });

    context('when buy amount is 0', () => {
      it('returns old price', async () => {
        const payAmount = ethPrice.mul(new BN(11));

        await oasisDex.setPayAmount(payAmount);
        const { logs } = await priceOracle.getOasisPrice(ethPrice);

        expectEvent.inLogs(logs, 'GetOasisPriceFailed', {
          oldPrice: toFixedBN(1),
        });
      });
    });

    context('when pay amount is 0', () => {
      it('returns old price', async () => {
        const buyAmount = ethPrice.mul(new BN(10));

        await oasisDex.setBuyAmount(buyAmount);
        const { logs } = await priceOracle.getOasisPrice(ethPrice);

        expectEvent.inLogs(logs, 'GetOasisPriceFailed', {
          oldPrice: toFixedBN(1),
        });
      });
    });
  });

  describe('#getUniswapPrice', () => {
    context('when DAI balance is valid', () => {
      it('returns uniswap price', async () => {
        const uniswapPrice = toFixedBN(1.01);
        const uniswapEthAmount = new BN(1000);
        const uniswapDaiAmount = ethPrice
          .mul(uniswapEthAmount)
          .div(uniswapPrice);

        await web3.eth.sendTransaction({
          from: owner,
          to: uniswap.address,
          value: uniswapEthAmount,
        });

        await dai.mint(uniswap.address, uniswapDaiAmount);
        expect(
          await priceOracle.getUniswapPrice(ethPrice),
        ).to.be.bignumber.closeTo(uniswapPrice, toFixedBN(0.001));
      });
    });

    context('when DAI balance is 0', () => {
      it('returns old price', async () => {
        expect(
          await priceOracle.getUniswapPrice(ethPrice),
        ).to.be.bignumber.equal(toFixedBN(1));
      });
    });
  });

  describe('#setOasisEthAmount', () => {
    context('when oasisEthAmount is invalid', () => {
      it('reverts', async () => {
        const oasisEthAmount = new BN(0);

        await expectRevert(
          priceOracle.setOasisEthAmount(oasisEthAmount),
          'DaiPriceOracle: invalid oasisEthAmount',
        );
      });
    });

    context('when oasisEthAmount is valid', () => {
      it('succeeds', async () => {
        const oasisEthAmount = toFixedBN(0.5);

        await priceOracle.setOasisEthAmount(oasisEthAmount);

        expect(await priceOracle.oasisEthAmount()).to.bignumber.equal(
          oasisEthAmount,
        );
      });
    });
  });

  describe('#setPriceBoundary', () => {
    context('when both upper bound and lower bound are valid', () => {
      it('succeeds', async () => {
        const newPriceUpperBound = toFixedBN(1.2);
        const newPriceLowerBound = toFixedBN(0.8);

        const { logs } = await priceOracle.setPriceBoundary(
          newPriceUpperBound,
          newPriceLowerBound,
        );

        expectEvent.inLogs(logs, 'SetPriceBoundarySucceed', {
          adminAddress: owner,
          priceUpperBound: newPriceUpperBound,
          priceLowerBound: newPriceLowerBound,
        });

        expect(await priceOracle.priceUpperBound()).to.bignumber.equal(
          newPriceUpperBound,
        );
        expect(await priceOracle.priceLowerBound()).to.bignumber.equal(
          newPriceLowerBound,
        );
      });
    });

    context('when upper bound is invalid', () => {
      it('reverts', async () => {
        const newPriceUpperBound = toFixedBN(0);
        const newPriceLowerBound = toFixedBN(0.8);

        await expectRevert(
          priceOracle.setPriceBoundary(newPriceUpperBound, newPriceLowerBound),
          'DaiPriceOracle: invalid upper bound price',
        );
      });
    });

    context('when lower bound is invalid', () => {
      it('reverts', async () => {
        const newPriceUpperBound = toFixedBN(1.2);
        const newPriceLowerBound = toFixedBN(100);

        await expectRevert(
          priceOracle.setPriceBoundary(newPriceUpperBound, newPriceLowerBound),
          'DaiPriceOracle: invalid lower bound price',
        );
      });
    });
  });
});
