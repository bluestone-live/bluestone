const debug = require('debug')('script:pauseContract');
const Protocol = artifacts.require(`./Protocol.sol`);
const { makeTruffleScript, loadNetwork } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const {
    contracts: { OwnedUpgradeabilityProxy: proxyAddress },
  } = loadNetwork(network);

  const protocol = await Protocol.at(proxyAddress);

  await protocol.pause();
  debug('Protocol paused');
});
