const debug = require('debug')('script:setMaxDistributorFeeRatios');
const Protocol = artifacts.require('./Protocol.sol');
const { makeTruffleScript, toFixedBN } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async network => {
  const { depositDistributorFeeRatio, loanDistributorFeeRatio } = config.get(
    'contract',
  );
  const protocol = await Protocol.deployed();
  await protocol.setMaxDistributorFeeRatios(
    toFixedBN(depositDistributorFeeRatio),
    toFixedBN(loanDistributorFeeRatio),
  );
  debug(
    `Max distributor fee ratios is set to ${depositDistributorFeeRatio} ${loanDistributorFeeRatio}`,
  );
});
