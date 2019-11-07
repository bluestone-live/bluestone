const debug = require('debug')('script:setMaxDistributorFeeRatios');
const ERC20Mock = artifacts.require('./ERC20Mock.sol');
const Protocol = artifacts.require('./Protocol.sol');
const { loadConfig, makeTruffleScript, toFixedBN } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const {
    maxDepositDistributorFeeRatio,
    maxLoanDistributorFeeRatio,
  } = loadConfig(network);
  const protocol = await Protocol.deployed();
  await protocol.setMaxDistributorFeeRatios(
    toFixedBN(maxDepositDistributorFeeRatio),
    toFixedBN(maxLoanDistributorFeeRatio),
  );
  debug(
    `Max distributor fee ratios is set to ${maxDepositDistributorFeeRatio} ${maxLoanDistributorFeeRatio}`,
  );
});
