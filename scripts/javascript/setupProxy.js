const debug = require('debug')('script:enableDepositToken');
const Protocol = artifacts.require('./Protocol.sol');
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy');
const { loadNetwork, makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const impl = await Protocol.deployed();
  await impl.initialize();

  const proxy = await OwnedUpgradeabilityProxy.deployed();
  await proxy.upgradeTo(impl.address);

  const protocol = await Protocol.at(proxy.address);
  await protocol.initialize();

  debug('Proxy has been set');
});
