const debug = require("debug")("script:setupEnvironment");
const DepositManager = artifacts.require("./DepositManager.sol");
const LoanManager = artifacts.require("./LoanManager.sol");
const Configuration = artifacts.require("./Configuration.sol");
const PriceOracle = artifacts.require("./PriceOracle.sol");
const ERC20Mock = artifacts.require("./ERC20Mock.sol");
const WrappedEther = artifacts.require("./WrappedEther.sol");
const TokenManager = artifacts.require("./TokenManager.sol");
const {
  makeTruffleScript,
  fetchTokenPrices,
  mergeNetworkConfig
} = require("./utils.js");
const { configuration } = require("../../config.js");
const { BN } = web3.utils;

module.exports = makeTruffleScript(async network => {
  if (network !== "development" && network !== "rinkeby") {
    throw "setupEnvironment should only run against testnet.";
  }

  if (!isValidConfiguartion(configuration)) {
    throw "Invalid configuration. Check your ./config.js file.";
  }

  const depositManager = await DepositManager.deployed();
  const loanManager = await LoanManager.deployed();
  const config = await Configuration.deployed();
  const {
    tokens,
    depositTerms,
    loanTerms,
    collateralRatio,
    liquidationDiscount,
    loanInterestRate
  } = configuration;

  const tokenSymbolListWithWETH = Object.keys(tokens);

  for (let i = 0; i < tokenSymbolListWithWETH.length; i++) {
    const symbol = tokenSymbolListWithWETH[i];
    const { name } = tokens[symbol];
    let deployedToken;

    if (symbol === "WETH") {
      deployedToken = await WrappedEther.new();
    } else {
      deployedToken = await ERC20Mock.new(name, symbol);
    }

    debug(`Deployed ${symbol} at ${deployedToken.address}`);
    tokens[symbol].address = deployedToken.address;
  }

  mergeNetworkConfig(network, {
    tokens
  });

  divider();

  try {
    for (let depositTerm of depositTerms) {
      await depositManager.enableDepositTerm(depositTerm);
      debug(`enableDepositTerm: ${depositTerm}`);
    }

    for (let loanTerm of loanTerms) {
      await loanManager.addLoanTerm(loanTerm);
      debug(`addLoanTerm: ${loanTerm}`);
    }
  } catch (e) {
    // just continue if the term already enabled
    console.log(e);
  }

  // TODO: not sure if we need to setup WETH
  const tokenSymbolList = tokenSymbolListWithWETH.filter(
    symbol => symbol !== "WETH"
  );

  for (let loanTokenSymbol of tokenSymbolList) {
    divider();

    const loanAsset = tokens[loanTokenSymbol].address;

    await depositManager.enableDepositAsset(loanAsset);
    debug(`enableDepositAsset: ${loanTokenSymbol}`);

    for (let loanTerm of loanTerms) {
      const decimalLoanInterestRate =
        loanInterestRate[loanTokenSymbol][loanTerm];
      await config.setLoanInterestRate(
        loanAsset,
        loanTerm,
        toFixedBN(decimalLoanInterestRate)
      );
      debug(
        `setLoanInterestRate: ${loanTokenSymbol} ${loanTerm} ${decimalLoanInterestRate}`
      );
    }

    for (let collateralTokenSymbol of tokenSymbolList) {
      const collateralAsset = tokens[collateralTokenSymbol].address;

      if (loanAsset !== collateralAsset) {
        await loanManager.enableLoanAssetPair(loanAsset, collateralAsset);
        debug(
          `enableLoanAssetPair: ${loanTokenSymbol} ${collateralTokenSymbol}`
        );

        const decimalCollateralRatio =
          collateralRatio[loanTokenSymbol][collateralTokenSymbol];
        await config.setCollateralRatio(
          loanAsset,
          collateralAsset,
          toFixedBN(decimalCollateralRatio)
        );
        debug(
          `setCollateralRatio: ${loanTokenSymbol} ${collateralTokenSymbol} ${decimalCollateralRatio}`
        );

        const decimalLiquidationDiscount =
          liquidationDiscount[loanTokenSymbol][collateralTokenSymbol];
        await config.setLiquidationDiscount(
          loanAsset,
          collateralAsset,
          toFixedBN(decimalLiquidationDiscount)
        );
        debug(
          `setLiquidationDiscount: ${loanTokenSymbol} ${collateralTokenSymbol} ${decimalLiquidationDiscount}`
        );
      }
    }
  }

  divider();

  const account = web3.eth.accounts.create();
  const { address } = account;

  debug(`setShareholderAddress: ${address}`);
  await config.setShareholderAddress(address);

  divider();

  const priceList = await fetchTokenPrices(tokenSymbolList);
  const scaledPriceList = priceList.map(price => toFixedBN(price));
  const priceOracle = await PriceOracle.deployed();
  const tokenAddressList = tokenSymbolList.map(
    tokenSymbol => tokens[tokenSymbol].address
  );

  debug(`setPrices: ${tokenSymbolList} ${priceList}`);
  await priceOracle.setPrices(tokenAddressList, scaledPriceList);

  divider();

  debug(`Initialize deposits for each asset and loans for each asset pair`);
  const tokenManager = await TokenManager.deployed();
  const accounts = await web3.eth.getAccounts();

  // Set depositor and loaner to the same account, so we can see transactions in one place
  const depositor = accounts[0];
  const loaner = accounts[0];

  const initialSupply = 1000000;
  const initialAllowance = 1000000;
  const depositAmount = 50000;
  const loanAmount = 100;
  const freedCollateralAmount = 0;

  for (let loanTokenSymbol of tokenSymbolList) {
    divider();

    const loanAsset = await ERC20Mock.at(tokens[loanTokenSymbol].address);

    await loanAsset.mint(depositor, toFixedBN(initialSupply));
    debug(`Mints ${initialSupply} ${loanTokenSymbol} to ${depositor}`);

    await loanAsset.approve(tokenManager.address, toFixedBN(initialAllowance), {
      from: depositor
    });
    debug(
      `Depositor approves sending ${initialAllowance} ${loanTokenSymbol} as deposit to protocol`
    );

    for (let depositTerm of depositTerms) {
      await depositManager.deposit(
        loanAsset.address,
        depositTerm,
        toFixedBN(depositAmount),
        { from: depositor }
      );
      debug(
        `Depositor deposits ${depositAmount} ${loanTokenSymbol} in ${depositTerm}-day term`
      );
    }

    for (let collateralTokenSymbol of tokenSymbolList) {
      if (collateralTokenSymbol !== loanTokenSymbol) {
        const collateralAsset = await ERC20Mock.at(
          tokens[collateralTokenSymbol].address
        );
        await collateralAsset.mint(loaner, toFixedBN(initialSupply));
        debug(`Mints ${initialSupply} ${collateralTokenSymbol} to ${loaner}`);

        await collateralAsset.approve(
          tokenManager.address,
          toFixedBN(initialAllowance),
          {
            from: loaner
          }
        );
        debug(
          `Loaner approves sending ${initialAllowance} ${collateralTokenSymbol} as collateral to protocol`
        );

        for (let loanTerm of loanTerms) {
          const loanAssetPrice =
            priceList[tokenSymbolList.indexOf(loanTokenSymbol)];
          const collateralAssetPrice =
            priceList[tokenSymbolList.indexOf(collateralTokenSymbol)];

          // 300% collateral ratio
          const collateralAmount = Math.round(
            ((loanAmount * loanAssetPrice) / collateralAssetPrice) * 3
          );

          await loanManager.loan(
            loanTerm,
            loanAsset.address,
            collateralAsset.address,
            toFixedBN(loanAmount),
            toFixedBN(collateralAmount),
            freedCollateralAmount,
            { from: loaner }
          );
          debug(
            `Loaner loans ${loanAmount} ${loanTokenSymbol} using ${collateralAmount} ${collateralTokenSymbol} collateral in ${loanTerm}-day term`
          );
        }
      }
    }
  }
});

function divider() {
  debug(`------------------------------------------------------------------`);
}

// TODO: have to duplicate this function as of now since `truffle exec` environment
// seems to have trouble handling require() statement correctly:
// https://github.com/trufflesuite/truffle/issues/255
// const { toFixedBN } = require('../../test/utils/index.js')
function toFixedBN(num, significant = 18) {
  let decimalPlaces = (num.toString().split(".")[1] || []).length;

  if (decimalPlaces === 0) {
    return new BN(num).mul(new BN(10).pow(new BN(significant)));
  } else {
    const integer = num * Math.pow(10, decimalPlaces);
    return new BN(integer).mul(
      new BN(10).pow(new BN(significant - decimalPlaces))
    );
  }
}

function isValidConfiguartion(configuration) {
  if (configuration) {
    const {
      tokens,
      depositTerms,
      loanTerms,
      collateralRatio,
      liquidationDiscount,
      loanInterestRate
    } = configuration;
    return (
      tokens &&
      depositTerms &&
      loanTerms &&
      collateralRatio &&
      liquidationDiscount &&
      loanInterestRate
    );
  } else {
    return false;
  }
}
