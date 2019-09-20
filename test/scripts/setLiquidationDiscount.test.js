const Configuration = artifacts.require('./Configuration.sol');
const setLiquidationDiscount = require('../../scripts/javascript/setLiquidationDiscount.js');
const deployTokens = require('../../scripts/javascript/deployTokens.js');
const { toFixedBN } = require('../utils/index.js');
const { expect } = require('chai');

describe('script: setLiquidationDiscount', () => {
  let config;
  const cb = () => {};
  const network = 'development';
  const loanTokenSymbol = 'ETH';
  const collateralTokenSymbol = 'DAI';

  before(async () => {
    config = await Configuration.deployed();
    await deployTokens(cb, network);
  });

  contract('Configuration', () => {
    context('when the liquidation discount is valid', () => {
      const liquidationDiscount = 0.05;

      it('succeeds', async () => {
        const [loanAsset, collateralAsset] = await setLiquidationDiscount(
          cb,
          network,
          loanTokenSymbol,
          collateralTokenSymbol,
          liquidationDiscount,
        );
        expect(
          await config.getLiquidationDiscount(loanAsset, collateralAsset),
        ).to.be.bignumber.equal(toFixedBN(liquidationDiscount));
      });
    });

    context('when the liquidation discount is invalid', () => {
      const liquidationDiscount = 0.06;

      it('fails', async () => {
        const res = await setLiquidationDiscount(
          cb,
          network,
          loanTokenSymbol,
          collateralTokenSymbol,
          liquidationDiscount,
        );
        expect(res).to.be.false;
      });
    });
  });
});
