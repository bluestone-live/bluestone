const debug = require('debug')('script:setProtocolAddress');
const Configuration = artifacts.require('./Configuration.sol');
const { makeTruffleScript } = require('./utils.js');

module.exports = makeTruffleScript(async (_, address) => {
  const configuration = await Configuration.deployed();

  debug(`Setting protocol address to ${address}...`);
  await configuration.setProtocolAddress(address);
});
