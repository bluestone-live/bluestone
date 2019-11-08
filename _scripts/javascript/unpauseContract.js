const debug = require('debug')('script:unpauseContract');
const { makeTruffleScript } = require('../utils.js');
const Protocol = artifacts.require(`./Protocol.sol`);

module.exports = makeTruffleScript(async _ => {
  const protocol = await Protocol.deployed();
  await protocol.unpause();
  debug('Protocol restarted');
});
