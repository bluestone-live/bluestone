const debug = require('debug')('script:pauseContract');
const { makeTruffleScript } = require('./utils.js');

module.exports = makeTruffleScript(async _ => {
  const Contract = artifacts.require(`./Protocol.sol`);
  const contract = await Contract.deployed();
  await contract.pause();
  debug('Protocol paused');
});
