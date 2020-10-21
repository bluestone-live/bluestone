const debug = require('debug')('script:setProtocolReserveRatio');
const Protocol = artifacts.require('./Protocol.sol');
const { makeTruffleScript, toFixedBN, loadNetwork } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async network => {
  const {
    contracts: { OwnedUpgradeabilityProxy: proxyAddress },
  } = loadNetwork(network);
  const { protocolReserveRatio } = config.get('contract');
  const protocol = await Protocol.at(proxyAddress);

  debug(`Set protocol reserve ratio to ${protocolReserveRatio}`);
  await protocol.setProtocolReserveRatio(toFixedBN(protocolReserveRatio));
  debug(`Protocol reserve ratio is set`);
});
