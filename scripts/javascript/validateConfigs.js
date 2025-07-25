const debug = require('debug')('script:validateConfigs');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript, toFixedBN } = require('../utils.js');
const config = require('config');

const assertNumberEquals = (a, b) => a.toString() === b.toString();

const composeLoanAndCollateralPairs = ({
  loanTokenAddressList,
  collateralTokenAddressList,
  isEnabledList,
  minCollateralCoverageRatioList,
  liquidationDiscountList,
}) => {
  const result = [];
  let i = 0;
  for (loanTokenAddress of loanTokenAddressList) {
    for (collateralTokenAddress of collateralTokenAddressList) {
      result.push({
        loanTokenAddress,
        collateralTokenAddress,
        isEnabled: isEnabledList[i],
        minCollateralCoverageRatio: minCollateralCoverageRatioList[i],
        liquidationDiscount: liquidationDiscountList[i],
      });
      i++;
    }
  }
  return result.filter((el) => el.isEnabled);
};

module.exports = makeTruffleScript(async (network) => {
  const networkConfig = loadNetwork(network);
  const configs = config.get('contract');
  const protocol = await Protocol.deployed();

  const tokens = Object.keys(configs.tokens).map((symbol) => ({
    symbol,
    ...configs.tokens[symbol],
  }));

  debug('Validate tokens configs');

  const { depositTokenAddressList } = await protocol.getDepositTokens();

  // Check if deposit token address equals configs
  if (depositTokenAddressList.length !== tokens.length) {
    return debug(
      `depositTokens expect ${tokens.map(
        (token) => token.address,
      )}, got ${depositTokenAddressList}`,
    );
  }

  const wrongAddresses = depositTokenAddressList.some(
    (address) =>
      tokens.filter((token) => token.address === address).length !== 1,
  );
  if (wrongAddresses.length > 0) {
    return debug(`Wrong deposit token ${wrongAddresses}`);
  }

  for (token of tokens) {
    // check if maxLoanTerm per token equals configs
    const maxLoanTerm = await protocol.getMaxLoanTerm(
      networkConfig.tokens[token.symbol].address,
    );

    if (!assertNumberEquals(maxLoanTerm, token.maxLoanTerm)) {
      return debug(
        `MaxLoanTerm- ${token.symbol} expect ${
          token.maxLoanTerm
        }, got ${maxLoanTerm.toString()}`,
      );
    }
  }

  debug('Validate deposit term');

  const depositTerms = (await protocol.getDepositTerms()).map((term) =>
    Number.parseInt(term.toString()),
  );

  if (configs.depositTerms.toString() !== depositTerms.toString()) {
    return debug(
      `DepositTerms- expect ${configs.depositTerms}, got ${depositTerms}`,
    );
  }

  debug('Validate loan and collateral pair configs');

  const protocolPairs = composeLoanAndCollateralPairs(
    await protocol.getLoanAndCollateralTokenPairs(),
  );

  const configPairs = configs.loanAndCollateralTokenPairs.map((pair) => ({
    ...pair,
    loanTokenAddress: networkConfig.tokens[pair.loanTokenSymbol].address,
    collateralTokenAddress:
      networkConfig.tokens[pair.collateralTokenSymbol].address,
  }));

  if (protocolPairs.length !== configPairs.length) {
    debug(`LoanAndCollateralPairs expect ${configPairs}, got ${protocolPairs}`);
  }

  const wrongPairs = configPairs.some((configPair) =>
    protocolPairs.filter(
      (protocolPair) =>
        protocolPair.loanTokenAddress === configPair.loanTokenAddress &&
        protocolPair.collateralTokenAddress ===
          configPair.collateralTokenAddress,
    ),
  );

  if (wrongPairs.length > 0) {
    debug(`Wrong loan and collateral token pairs: ${wrongPairs}`);
  }

  for (configPair of configPairs) {
    const currentPair = protocolPairs.find(
      (pair) =>
        pair.loanTokenAddress === configPair.loanTokenAddress &&
        pair.collateralTokenAddress === configPair.collateralTokenAddress,
    );

    if (
      assertNumberEquals(
        currentPair.liquidationDiscount,
        configPair.liquidationDiscount,
      )
    ) {
      return debug(
        `LiquidationDiscount- ${configPair.loanTokenSymbol} -> ${configPair.collateralTokenSymbol} expect ${configPair.liquidationDiscount}, got ${currentPair.liquidationDiscount}`,
      );
    }

    if (
      assertNumberEquals(
        currentPair.minCollateralCoverageRatio,
        configPair.minCollateralCoverageRatio,
      )
    ) {
      return debug(
        `MinCollateralCoverageRatio- ${configPair.loanTokenSymbol} -> ${configPair.collateralTokenSymbol} expect ${configPair.liquidationDiscount}, got ${currentPair.liquidationDiscount}`,
      );
    }
  }

  debug('Validate miscellaneous');

  const { contracts } = loadNetwork(network);

  const interestRateModelAddress = await protocol.getInterestRateModelAddress();

  if (contracts.InterestRateModel !== RateAddress) {
    return debug(
      `Wrong InterestRateModelAddress: expect ${contracts.InterestRateModel}, got ${interestRateModelAddress}`,
    );
  }

  const protocolReserveRatio = await protocol.getProtocolReserveRatio();

  if (
    !assertNumberEquals(
      toFixedBN(configs.protocolReserveRatio),
      protocolReserveRatio,
    )
  ) {
    return debug(
      `Protocol reserve ratio expect ${toFixedBN(
        configs.protocolReserveRatio,
      ).toString()}, got ${protocolReserveRatio.toString()}`,
    );
  }

  const interestReserveAddress = await protocol.getInterestReserveAddress();

  if (configs.interestReserveAddress !== interestReserveAddress) {
    return debug(
      `Protocol address expect ${configs.interestReserveAddress}, got ${interestReserveAddress}`,
    );
  }

  const { depositDistributorFeeRatio, loanDistributorFeeRatio } =
    await protocol.getMaxDistributorFeeRatios();

  if (configs.depositDistributorFeeRatio !== depositDistributorFeeRatio) {
    return debug(
      `MaxDepositDistributorFeeRatio expect ${configs.depositDistributorFeeRatio}, got ${depositDistributorFeeRatio}`,
    );
  }

  if (configs.loanDistributorFeeRatio !== loanDistributorFeeRatio) {
    return debug(
      `MaxLoanDistributorFeeRatio expect ${configs.loanDistributorFeeRatio}, got ${loanDistributorFeeRatio}`,
    );
  }
});
