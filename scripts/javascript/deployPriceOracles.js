const {
  makeTruffleScript,
  loadNetwork,
  saveNetwork,
  toFixedBN,
} = require('../utils.js');
const { BN } = require('web3-utils');
const debug = require('debug')('script:deployPriceOracles');
const MedianizerMock = artifacts.require('MedianizerMock');
const OasisDexMock = artifacts.require('OasisDexMock');
const EthPriceOracle = artifacts.require('EthPriceOracle');
const FixedPriceOracle = artifacts.require('FixedPriceOracle');
const DaiPriceOracle = artifacts.require('DaiPriceOracle');
const ERC20Mock = artifacts.require('ERC20Mock');
const Protocol = artifacts.require('Protocol');

module.exports = makeTruffleScript(async network => {
  const { tokens } = loadNetwork(network);

  const { ETH, DAI, USDT } = tokens;

  if (!ETH || !DAI || !USDT) {
    throw new Error('Please ensure tokens are deployed.');
  }

  // TODO(desmond): use exisiting medianizer for main net
  const medianizer = await MedianizerMock.deployed();
  const oasisDex = await OasisDexMock.deployed();

  const ethPriceOracle = await EthPriceOracle.new(medianizer.address);
  const ethPrice = await ethPriceOracle.getPrice();

  // Setup uniswap
  const uniswap = await web3.eth.accounts.create();
  const uniswapPrice = toFixedBN(1);
  const uniswapEthAmount = new BN(1);
  const uniswapDaiAmount = ethPrice.mul(uniswapEthAmount).div(uniswapPrice);
  const accounts = await web3.eth.getAccounts();

  await web3.eth.sendTransaction({
    from: accounts[0],
    to: uniswap.address,
    value: uniswapEthAmount,
  });

  const dai = await ERC20Mock.at(DAI.address);
  await dai.mint(uniswap.address, uniswapDaiAmount);

  const oasisEthAmount = toFixedBN(10);
  const priceUpperBound = toFixedBN(1.1);
  const priceLowerBound = toFixedBN(0.9);

  const daiPriceOracle = await DaiPriceOracle.new(
    ETH.address,
    DAI.address,
    medianizer.address,
    oasisDex.address,
    uniswap.address,
    oasisEthAmount,
    priceUpperBound,
    priceLowerBound,
  );
  const usdtPriceOracle = await FixedPriceOracle.new(toFixedBN(1));
  const protocol = await Protocol.deployed();

  const setPriceOracle = async (
    tokenSymbol,
    tokenAddress,
    priceOracleAddress,
  ) => {
    debug(`Set ${tokenSymbol} price oracle address: ${priceOracleAddress}`);
    await protocol.setPriceOracle(tokenAddress, priceOracleAddress);

    saveNetwork(
      network,
      ['tokens', tokenSymbol, 'priceOracleAddress'],
      priceOracleAddress,
    );
  };

  await setPriceOracle('ETH', ETH.address, ethPriceOracle.address);
  await setPriceOracle('DAI', DAI.address, daiPriceOracle.address);
  await setPriceOracle('USDT', USDT.address, usdtPriceOracle.address);
});
