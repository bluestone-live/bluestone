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

module.exports = makeTruffleScript(async (network) => {
  const { tokens } = loadNetwork(network);

  const { ETH, DAI, USDT, USDC } = tokens;

  if (!ETH || !DAI || !USDT || !USDC) {
    throw new Error('Please ensure tokens are deployed.');
  }

  const medianizer =
    network === 'main'
      ? { address: '0x729D19f657BD0614b4985Cf1D82531c67569197B' } // Medianizer address
      : await MedianizerMock.deployed();

  const ethPriceOracle = await EthPriceOracle.new(medianizer.address);
  const ethPrice = await ethPriceOracle.getPrice();

  const oasisDex =
    network === 'main'
      ? { address: '0x794e6e91555438aFc3ccF1c5076A74F42133d08D' } // OasisV2 DEX address
      : await OasisDexMock.deployed();

  if (network !== 'main') {
    // Setup Oasis
    await oasisDex.setBuyAmount(ethPrice.mul(new BN(10)));
    await oasisDex.setPayAmount(ethPrice.mul(new BN(10)));
  }

  const uniswap =
    network === 'main'
      ? { address: '0x2a1530C4C41db0B0b2bB646CB5Eb1A67b7158667' } // Uniswap V1 DAI Exchange Address
      : await web3.eth.accounts.create();

  if (network !== 'main') {
    // Setup uniswap
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
  }

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
  const fixedPriceOracle = await FixedPriceOracle.new(toFixedBN(1));
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

  await Promise.all([
    setPriceOracle('ETH', ETH.address, ethPriceOracle.address),
    setPriceOracle('DAI', DAI.address, daiPriceOracle.address),
    setPriceOracle('USDT', USDT.address, fixedPriceOracle.address),
    setPriceOracle('USDC', USDC.address, fixedPriceOracle.address),
  ]);
});
