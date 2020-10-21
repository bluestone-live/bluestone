const debug = require('debug')('script:unpauseContract');
const Protocol = artifacts.require(`./Protocol.sol`);
const { makeTruffleScript, loadNetwork } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const {
    contracts: { OwnedUpgradeabilityProxy: proxyAddress },
  } = loadNetwork(network);

  const protocol = await Protocol.at(proxyAddress);

  await protocol.unpause();
  debug('Protocol restarted');
});
