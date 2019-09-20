const Configuration = artifacts.require('Configuration');
const setProtocolReserveRatio = require('../../scripts/javascript/setProtocolReserveRatio.js');
const { toFixedBN } = require('../utils/index.js');
const { expect } = require('chai');

describe('script: setProtocolReserveRatio', () => {
  let config;
  const cb = () => {};
  const network = 'development';

  before(async () => {
    config = await Configuration.deployed();
  });

  contract('Configuration', () => {
    context('when input is valid', () => {
      it('succeeds', async () => {
        const value = 0.1;
        await setProtocolReserveRatio(cb, network, value);

        expect(await config.getProtocolReserveRatio()).to.be.bignumber.equal(
          toFixedBN(value),
        );
      });
    });

    context('when input is invalid', () => {
      it('fails', async () => {
        const value = 0.31;
        const succeed = await setProtocolReserveRatio(cb, network, value);

        expect(succeed).to.be.false;
      });
    });
  });
});
