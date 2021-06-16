const config = require('config');
const { Wallet } = require('@rocketprotocolproject/wallet');
const { Contract } = require('@rocketprotocolproject/contracts');
const { BigNumber } = require('@rocketprotocolproject/bignumber');
const { rocketprotocol } = require('rocketprotocol');
const { loadNetwork, toFixedBN } = require('../utils');

const protocolAbi = [
  'function getDepositTokens()external view returns (address[] depositTokenAddressList)',
  'function getTokenPrice(address tokenAddress) external view returns (uint256 tokenPrice)',
  'function setPriceOracle(address tokenAddress, address priceOracle) external',
  'function enableDepositTerm(uint256 term) external',
  'function enableDepositTerms(uint256[] terms) external',
  'function enableDepositToken(address tokenAddress) external',
  'function setLoanAndCollateralTokenPair(address loanTokenAddress, address collateralTokenAddress, uint256 minCollateralCoverageRatio, uint256 liquidationDiscount) external',
  'function setInterestModel(address interestModel) external',
  'function setInterestReserveAddress(address interestReserveAddress) external',
  'function setProtocolReserveRatio(uint256 protocolReserveRatio) external',
  'function setMaxDistributorFeeRatios(uint256 depositDistributorFeeRatio, uint256 loanDistributorFeeRatio) external',
  'function setBalanceCap(address tokenAddress, uint256 balanceCap) external',
];

const interestModelAbi = [
  'function setLoanParameters(address tokenAddress, uint256 loanInterestRateLowerBound, uint256 loanInterestRateUpperBound) external',
];

const priceOracleAbi = ['function getPrice() external view returns (uint256)'];

async function setupEnvRocket() {
  const network = 'main';
  // So config will look for configurations in config/<network>.js
  process.env.NODE_ENV = network;
  const wallet = await getWallet();
  const protocol = await getProtocol(wallet, network);
  console.log(await protocol.getDepositTokens());
  console.log(await wallet.getAddress());

  // await setPriceOracles(wallet, network, { protocol });
  await enableDepositTerms(wallet, network, { protocol });
  // await enableDepositTokens(wallet, network, { protocol });
  // await enableLoanAndCollateralTokenPairs(wallet, network, { protocol });
  // await setInterestModel(wallet, network, { protocol });
  // await setInterestReserveAddress(wallet, network, { protocol });
  // await setProtocolReserveRatio(wallet, network, { protocol });
  // await setMaxDistributorFeeRatios(wallet, network, { protocol });
  // await setLoanInterestRates(wallet, network);
  // await setBalanceCaps(wallet, network, { protocol });
}

function getWallet() {
  const network = {
    name: 'defi_demo_rocket',
    address: 'ws://gate.tuntunhz.com:8888/api/writer/walletSDKJS',
  };
  const connectionInfo = { url: 'http://api.tuntunhz.com:9988' };
  const provider = new rocketprotocol.providers.RocketProtocolProvider(
    connectionInfo,
    network,
  );
  // Address 0xD80BE1b10B93CC9a165ff733e2b7554075Df4Dcf
  const privateKey = '';

  return new Wallet(privateKey, provider);
}

function getProtocol(wallet, network) {
  const { contracts } = loadNetwork(network);
  return new Contract(contracts.Protocol, protocolAbi, wallet);
}

async function setPriceOracles(wallet, network, { protocol }) {
  const { tokens } = loadNetwork(network);

  for (const token in tokens) {
    const tokenInfo = tokens[token];
    console.log(
      `Setting ${token} oracle address: ${tokenInfo.priceOracleAddress}`,
    );

    await protocol.setPriceOracle(
      tokenInfo.address,
      tokenInfo.priceOracleAddress,
    );
    console.log(`${token} oracle address is set`);

    const price = protocol.getTokenPrice(tokenInfo.address).toString();
    console.log(`Current ${token} price: ${price}`);
  }
}

async function enableDepositTerms(wallet, network, { protocol }) {
  const { depositTerms } = config.get('contract');
  console.log(`Enabling deposit terms: ${depositTerms}`);
  // await protocol.enableDepositTerms(depositTerms);
  for (const term of depositTerms) {
    console.log(`Enabling term ${term}`);
    await protocol.enableDepositTerm(term);
  }
  console.log('Done');
}

async function enableDepositTokens(wallet, network, { protocol }) {
  const { loanAndCollateralTokenPairs } = config.get('contract');
  const loanTokens = loanAndCollateralTokenPairs.map((p) => p.loanTokenSymbol);
  const { tokens } = loadNetwork(network);
  for (const loanToken of loanTokens) {
    console.log(`Enabling deposit token ${loanToken}`);
    let tokenInfo = tokens[loanToken];
    if (!tokenInfo || !tokenInfo.address) {
      throw `${loanToken} is not deployed yet.`;
    }
    await protocol.enableDepositToken(tokenInfo.address);
    console.log(`${loanToken} is enabled.`);
  }
}

async function enableLoanAndCollateralTokenPairs(
  wallet,
  network,
  { protocol },
) {
  const { tokens } = loadNetwork(network);
  const { loanAndCollateralTokenPairs } = config.get('contract');

  for (const pair of loanAndCollateralTokenPairs) {
    console.log(
      `Enabling loan pair: ${pair.collateralTokenSymbol} -> ${pair.loanTokenSymbol}`,
    );

    const loanToken = tokens[pair.loanTokenSymbol];
    const collateralToken = tokens[pair.collateralTokenSymbol];
    if (!loanToken || !loanToken.address) {
      throw `${pair.loanTokenSymbol} is not deployed yet`;
    }
    if (!collateralToken || !collateralToken.address) {
      throw `${pair.collateralTokenSymbol} is not deployed yet`;
    }

    await protocol.setLoanAndCollateralTokenPair(
      loanToken.address,
      collateralToken.address,
      toFixedBN(pair.minCollateralCoverageRatio),
      toFixedBN(pair.liquidationDiscount),
    );
    console.log(
      `Loan pair: ${pair.collateralTokenSymbol} -> ${pair.loanTokenSymbol} is enabled`,
    );
  }
}

async function setInterestModel(wallet, network, { protocol }) {
  console.log(`Setting interest model`);
  const { contracts } = loadNetwork(network);
  const interestModelAddress = contracts.InterestModel;
  if (!interestModelAddress) {
    throw 'Interest model is not deployed yet';
  }

  await protocol.setInterestModel(interestModelAddress);
  console.log('Interest model is set');
}

async function setInterestReserveAddress(wallet, network, { protocol }) {
  const { interestReserveAddress } = config.get('contract');
  console.log(`Setting interest reserve address to ${interestReserveAddress}`);
  await protocol.setInterestReserveAddress(interestReserveAddress);
  console.log('Interest reserve address is set');
}

async function setProtocolReserveRatio(wallet, network, { protocol }) {
  const { protocolReserveRatio } = config.get('contract');
  console.log(`Setting protocol reserve ratio to ${protocolReserveRatio}`);
  await protocol.setProtocolReserveRatio(toFixedBN(protocolReserveRatio));
  console.log(`Protocol reserve ratio is set`);
}

async function setMaxDistributorFeeRatios(wallet, network, { protocol }) {
  const { depositDistributorFeeRatio, loanDistributorFeeRatio } = config.get(
    'contract',
  );
  console.log(
    `Setting max deposit/loan distributor fee ratios to ${depositDistributorFeeRatio}/${loanDistributorFeeRatio}`,
  );
  await protocol.setMaxDistributorFeeRatios(
    toFixedBN(depositDistributorFeeRatio),
    toFixedBN(loanDistributorFeeRatio),
  );
  console.log('max deposit/loan distributor fee ratios are set');
}

async function setLoanInterestRates(wallet, network) {
  const { contracts, tokens } = loadNetwork(network);
  const interestModel = await new Contract(
    contracts.InterestModel,
    interestModelAbi,
    wallet,
  );

  for (const token in tokens) {
    const {
      loanInterestRateLowerBound,
      loanInterestRateUpperBound,
    } = config.get(`contract.tokens.${token}`);
    console.log(
      `Setting loan interest rates for ${token} from ${loanInterestRateLowerBound} to ${loanInterestRateUpperBound}`,
    );

    if (!loanInterestRateLowerBound || !loanInterestRateUpperBound) {
      throw `loan interest rate lower bound of upper bound for ${token} is not defined`;
    }

    await interestModel.setLoanParameters(
      tokens[token].address,
      toFixedBN(loanInterestRateLowerBound),
      toFixedBN(loanInterestRateUpperBound),
    );
    console.log(`Loan interest rate for ${token} is set`);
  }
}

async function setBalanceCaps(wallet, network, { protocol }) {
  const { tokens } = loadNetwork(network);

  for (const token in tokens) {
    console.log(`Setting balance cap for ${token}`);
    const tokenBalanceCap = config.get('contract.tokens')[token].balanceCap;
    if (!tokenBalanceCap) {
      throw `Balance cap for ${token} is not defined`;
    }

    await protocol.setBalanceCap(
      tokens[token].address,
      toFixedBN(tokenBalanceCap),
    );
    console.log(`Balance cap for ${token} is set`);
  }
}

setupEnvRocket().then(
  () => console.log('Environment setup successfully!'),
  (error) => console.log(error),
);
