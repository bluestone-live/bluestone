const Configuration = artifacts.require("./Configuration.sol");
const PriceOracle = artifacts.require("./PriceOracle.sol");
const TokenManager = artifacts.require("./TokenManager.sol");
const LiquidityPools = artifacts.require("./LiquidityPools.sol");
const DepositManager = artifacts.require("./DepositManager.sol");
const LoanManager = artifacts.require("./LoanManager.sol");
const AccountManager = artifacts.require("./AccountManager.sol");
const DepositManagerMock = artifacts.require("./DepositManagerMock.sol");
const LoanManagerMock = artifacts.require("./LoanManagerMock.sol");

module.exports = async function(deployer, network) {
  await deployer.deploy(DepositManager)
  await deployer.deploy(LoanManager)

  const depositManager = await DepositManager.deployed()
  const loanManager = await LoanManager.deployed()

  await depositManager.init(
    Configuration.address, 
    PriceOracle.address, 
    TokenManager.address,
    LiquidityPools.address,
    LoanManager.address
  )

  await loanManager.init(
    Configuration.address,
    PriceOracle.address,
    TokenManager.address,
    LiquidityPools.address,
    DepositManager.address,
    AccountManager.address
  )

  if (network === 'development') {
    // Deploy and initialize mocks
    await deployer.deploy(DepositManagerMock)
    await deployer.deploy(LoanManagerMock)

    const depositManagerMock = await DepositManagerMock.deployed()
    const loanManagerMock = await LoanManagerMock.deployed()

    await depositManagerMock.init(
      Configuration.address, 
      PriceOracle.address, 
      TokenManager.address,
      LiquidityPools.address,
      LoanManagerMock.address
    )

    await depositManagerMock.enableDepositTerm(30)

    await loanManagerMock.init(
      Configuration.address,
      PriceOracle.address,
      TokenManager.address,
      LiquidityPools.address,
      DepositManagerMock.address,
      AccountManager.address
    )

    await loanManagerMock.addLoanTerm(7)
    await loanManagerMock.addLoanTerm(30)
  }
};
