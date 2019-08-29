const TokenManager = artifacts.require("TokenManager");
const Configuration = artifacts.require("Configuration");
const DateTime = artifacts.require("DateTime");
const DepositManager = artifacts.require("DepositManagerMock");
const { time } = require("openzeppelin-test-helpers");
const { createERC20Token, toFixedBN } = require("../../utils/index.js");

contract('DepositManager', ([owner, depositor]) => {
  let depositManager, tokenManager, config

  before(async () => {
    depositManager = await DepositManager.deployed() 
    tokenManager = await TokenManager.deployed()
    config = await Configuration.deployed()
    datetime = await DateTime.new()
    await config.setShareholderAddress(owner)
  })

  describe('deposit flow positive #1', () => {
    const initialSupply = toFixedBN(100)
    let term, asset

    before(async () => {
      term = (await depositManager.getDepositTerms())[0].toNumber()
      asset = await createERC20Token(depositor, initialSupply)
      await asset.approve(tokenManager.address, initialSupply, { from: depositor })
      await depositManager.enableDepositAsset(asset.address, { from: owner })
    })

    let deposit;

    it("deposits", async () => {
      await depositManager.deposit(asset.address, term, toFixedBN(50), {
        from: depositor
      });
      deposit = await depositManager.deposits.call(0);
    });

    context("when deposit term is matured", () => {
      before(async () => {
        config.lockAllUserActions();
        await time.increase(time.duration.days(term + 1))

        for (let i = 0; i < term; i++) {
          await depositManager.updateDepositMaturity(asset.address, { from: owner })
        }

        config.unlockAllUserActions();
      })

      it('withdraws deposit', async () => {
        await depositManager.withdraw(deposit, { from: depositor })
      })
    })
  })
})
