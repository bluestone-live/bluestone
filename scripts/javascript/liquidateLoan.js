const debug = require('debug')('script:liquidateLoan');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript, toFixedBN } = require('../utils.js');

module.exports = makeTruffleScript(
  async (network, loanId, liquidateLoanAmount) => {
    const { contracts } = loadNetwork(network);
    const protocol = await Protocol.at(contracts.Protocol);
    await protocol.liquidateLoan(loanId, toFixedBN(liquidateLoanAmount));
  },
);
