const debug = require('debug')('script:setPriceOracleAddress');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const { contracts } = loadNetwork(network);
  let PriceOracleAddress = contracts.PriceOracle;
  if (!PriceOracleAddress) {
    return debug('Price oracle is not deployed yet');
  }
  const protocol = await Protocol.deployed();
  await protocol.setPriceOracleAddress(PriceOracleAddress);
  return debug('Price oracle is set');
});
