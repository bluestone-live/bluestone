const debug = require('debug')('script:setInterestModel');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const { contracts } = loadNetwork(network);
  let PayableProxyAddress = contracts.PayableProxy;
  if (!PayableProxyAddress) {
    return debug('PayableProxy is not deployed yet');
  }
  const protocol = await Protocol.deployed();
  await protocol.setPayableProxy(PayableProxyAddress);
  return debug('PayableProxy is set');
});
