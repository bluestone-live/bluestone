const PriceOracle = artifacts.require('PriceOracle')
const TokenManager = artifacts.require('TokenManager')
const Loan = artifacts.require('Loan')
const { toFixedBN, createERC20Token } = require("../../utils/index.js");
const { DepositManagerMock, LoanManagerMock } = require("../../utils/mocks.js");
const { expect } = require("chai");

contract("LoanManager", ([owner, depositor, loaner]) => {
  const initialSupply = toFixedBN(1000)
  const depositAmount = toFixedBN(100)
  let depositManager, loanManager, loanAsset, collateralAsset;

  before(async () => {
    priceOracle = await PriceOracle.deployed()
    tokenManager = await TokenManager.deployed()
    depositManager = await DepositManagerMock();
    loanManager = await LoanManagerMock();
    loanAsset = await createERC20Token(depositor, initialSupply);
    collateralAsset = await createERC20Token(loaner, initialSupply);

    await priceOracle.setPrice(loanAsset.address, toFixedBN(10))
    await priceOracle.setPrice(collateralAsset.address, toFixedBN(10))
    await loanAsset.approve(tokenManager.address, initialSupply, { from: depositor })
    await loanAsset.mint(loaner, initialSupply)
    await loanAsset.approve(tokenManager.address, initialSupply, { from: loaner })
    await collateralAsset.approve(tokenManager.address, initialSupply, { from: loaner })
    await depositManager.enableDepositAsset(loanAsset.address, { from: owner });
    await depositManager.deposit(loanAsset.address, 1, depositAmount, false, { from: depositor })
    await depositManager.deposit(loanAsset.address, 7, depositAmount, false, { from: depositor })
    await depositManager.deposit(loanAsset.address, 30, depositAmount, false, { from: depositor })
    await loanManager.enableLoanAssetPair(loanAsset.address, collateralAsset.address, { from: owner })
  });

  const createLoan = async (
    term = 1,
    loanAmount = toFixedBN(10),
    collateralAmount = toFixedBN(30),
    requestedFreedCollateral = 0
  ) => {
    await loanManager.loan(
      term, 
      loanAsset.address, 
      collateralAsset.address, 
      loanAmount,
      collateralAmount,
      requestedFreedCollateral,
      { from: loaner }
    )
  }

  describe("#getLoansByUser", () => {
    before(async () => {
      await createLoan()
      await createLoan()
    }) 

    it('succeeds', async () => {
      const loanAddresses = await loanManager.getLoansByUser(loaner)
      expect(loanAddresses.length).to.equal(2)
      expect(loanAddresses[0]).to.equal((await loanManager.loans.call(0)))
      expect(loanAddresses[1]).to.equal((await loanManager.loans.call(1)))
    })
  })

  describe('#addCollateral', () => {
    let prevCollateralAssetBalance

    before(async () => {
      await createLoan()
      prevCollateralAssetBalance = await collateralAsset.balanceOf(loaner)
    })

    it('succeeds', async () => {
      const loanAddress = await loanManager.loans.call(0)
      const collateralAmount = toFixedBN(10)
      const requestedFreedCollateral = 0
      await loanManager.addCollateral(loanAddress, collateralAmount, requestedFreedCollateral, { from: loaner })

      expect(await collateralAsset.balanceOf(loaner)).to.be.bignumber
        .equal(prevCollateralAssetBalance.sub(collateralAmount))
    })
  })
});
