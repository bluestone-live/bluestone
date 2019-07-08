const TokenManager = artifacts.require('TokenManager')
const { toFixedBN, createERC20Token } = require("../../utils/index.js");
const { DepositManagerMock } = require("../../utils/mocks.js");
const { expect } = require("chai");

contract("DepositManager", ([owner, depositor]) => {
  const initialSupply = toFixedBN(1000)
  let depositManager, tokenManager, asset;

  before(async () => {
    depositManager = await DepositManagerMock();
    tokenManager = await TokenManager.deployed()
    asset = await createERC20Token(depositor, initialSupply);
    await asset.approve(tokenManager.address, initialSupply, { from: depositor })
    await depositManager.enableDepositAsset(asset.address);
  });

  describe("#getDepositInterestRates", () => {
    it("succeeds", async () => {
      const res = await depositManager.getDepositInterestRates(
        asset.address
      );

      expect(res[0]).to.be.bignumber.equal('0')
      expect(res[1]).to.be.bignumber.equal('0')
      expect(res[2]).to.be.bignumber.equal('0')
    });
  });

  describe("#getDepositsByUser", () => {
    const term = 1
    const amount = toFixedBN(50)
    const isRecurring = false

    before(async () => {
      await depositManager.deposit(asset.address, term, amount, isRecurring, { from: depositor })
      await depositManager.deposit(asset.address, term, amount, isRecurring, { from: depositor })
    })

    it("succeeds", async () => {
      const deposits = await depositManager.getDepositsByUser(depositor)

      expect(deposits.length).to.equal(2)
      expect(deposits[0]).to.equal((await depositManager.deposits.call(0)))
      expect(deposits[1]).to.equal((await depositManager.deposits.call(1)))
    })
  })

  describe("#updateInterestIndexHistory", () => {
    const initialInterestIndex = toFixedBN(1);
    const updatedInterestIndex = toFixedBN(2);
    const term = 1;
    const numDays = 30;

    before(async () => {
      await depositManager.prepareInterestIndexHistory(
        asset.address,
        term,
        initialInterestIndex,
        numDays
      );
    });

    it("succeeds", async () => {
      await depositManager.updateInterestIndexHistory(
        asset.address,
        term,
        updatedInterestIndex
      );
    });

    it("updates interestIndex of lastDay", async () => {
      const actualInterestIndex = await depositManager.getInterestIndexFromDaysAgo(
        asset.address,
        term,
        0
      );
      expect(actualInterestIndex).to.be.bignumber.equal(updatedInterestIndex);
    });

    it("does not update interestIndex of the day before lastDay", async () => {
      const actualInterestIndex = await depositManager.getInterestIndexFromDaysAgo(
        asset.address,
        term,
        1
      );
      expect(actualInterestIndex).to.be.bignumber.equal(initialInterestIndex);
    });

    it("does not update interestIndex of firstDay", async () => {
      const actualInterestIndex = await depositManager.getInterestIndexFromDaysAgo(
        asset.address,
        term,
        numDays - 1
      );
      expect(actualInterestIndex).to.be.bignumber.equal(initialInterestIndex);
    });

    it("clears interestIndex of the day before firstDay", async () => {
      const actualInterestIndex = await depositManager.getInterestIndexFromDaysAgo(
        asset.address,
        term,
        numDays
      );
      expect(actualInterestIndex).to.be.bignumber.equal("0");
    });
  });
});
