const FixedPriceOracle = artifacts.require('FixedPriceOracle');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const { deploy, toFixedBN } = require('../scripts/utils');

module.exports = async function (deployer, network) {
  // Deploy a fixed price oracle as the USDT oracle.
  await deploy(
    deployer,
    network,
    FixedPriceOracle,
    ['tokens', 'USDT', 'priceOracleAddress'],
    toFixedBN(1),
  );

  // Deploy a single feed price oracle as the WETH oracle.
  await deploy(deployer, network, SingleFeedPriceOracle, [
    'tokens',
    'WETH',
    'priceOracleAddress',
  ]);
};
