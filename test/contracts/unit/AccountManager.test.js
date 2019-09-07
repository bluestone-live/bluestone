const AccountManager = artifacts.require("AccountManager");
const TokenManager = artifacts.require("TokenManager");
const { createERC20Token, toFixedBN } = require("../../utils/index.js");
const { BN, expectEvent } = require("openzeppelin-test-helpers");
const { expect } = require("chai");

contract("AccountManager", ([owner]) => {
  let accountManager, token, tokenManager;
  const increaseAmount = toFixedBN(100);
  const decreaseAmount = toFixedBN(50);

  before(async () => {
    accountManager = await AccountManager.deployed();
    tokenManager = await TokenManager.deployed();
    token = await createERC20Token(owner);
  });

  describe("Statistics", () => {
    const totalDeposits = new BN(100);
    const totalDepositAmount = new BN(1000);

    describe("#setGeneralStat", () => {
      it("succeeds", async () => {
        const key = "totalDeposits";

        await accountManager.setGeneralStat(owner, key, totalDeposits);
        expect(
          await accountManager.getGeneralStat(owner, key)
        ).to.bignumber.equal(totalDeposits);
      });
    });

    describe("#incrementGeneralStat", () => {
      it("succeeds", async () => {
        const key = "totalDeposits";

        await accountManager.incrementGeneralStat(owner, key, new BN(1));
        expect(
          await accountManager.getGeneralStat(owner, key)
        ).to.bignumber.equal(totalDeposits.add(new BN(1)));
      });
    });

    describe("#setAssetStat", () => {
      it("succeeds", async () => {
        const key = "totalDepositAmount";

        await accountManager.setAssetStat(
          owner,
          token.address,
          key,
          totalDepositAmount
        );
        expect(
          await accountManager.getAssetStat(owner, token.address, key)
        ).to.bignumber.equal(totalDepositAmount);
      });
    });

    describe("#incrementAssetStat", () => {
      it("succeeds", async () => {
        const key = "totalDepositAmount";

        await accountManager.incrementAssetStat(
          owner,
          token.address,
          key,
          new BN(100)
        );
        expect(
          await accountManager.getAssetStat(owner, token.address, key)
        ).to.bignumber.equal(totalDepositAmount.add(new BN(100)));
      });
    });
  });

  describe("#getFreedCollateral", () => {
    it("succeeds", async () => {
      const amount = await accountManager.getFreedCollateral(token.address, {
        from: owner
      });
      expect(amount).to.be.bignumber.equal(toFixedBN(0));
    });
  });

  describe("#increaseFreedCollateral", () => {
    it("succeeds", async () => {
      await accountManager.increaseFreedCollateral(
        token.address,
        owner,
        increaseAmount
      );
      const amount = await accountManager.getFreedCollateral(token.address, {
        from: owner
      });
      expect(amount).to.be.bignumber.equal(increaseAmount);
    });

    after(async () => {
      await accountManager.decreaseFreedCollateral(
        token.address,
        owner,
        increaseAmount
      );
    });
  });
  describe("#decreaseFreedCollateral", () => {
    before(async () => {
      await accountManager.increaseFreedCollateral(
        token.address,
        owner,
        increaseAmount
      );
    });
    it("succeeds", async () => {
      await accountManager.decreaseFreedCollateral(
        token.address,
        owner,
        decreaseAmount
      );

      const amount = await accountManager.getFreedCollateral(token.address, {
        from: owner
      });

      expect(amount).to.be.bignumber.equal(increaseAmount.sub(decreaseAmount));
    });
  });
  describe("#withdrawFreedCollateral", () => {
    let balance, freedCollateralAmount;

    before(async () => {
      token = await createERC20Token(owner);
      balance = await token.balanceOf(owner);
      await token.mint(tokenManager.address, increaseAmount.mul(toFixedBN(10)));
      await accountManager.increaseFreedCollateral(
        token.address,
        owner,
        increaseAmount
      );
      freedCollateralAmount = await accountManager.getFreedCollateral(
        token.address,
        {
          from: owner
        }
      );
    });

    it("succeeds and emit WithdrawFreedCollateralSuccessful event", async () => {
      const { logs } = await accountManager.withdrawFreedCollateral(
        token.address,
        decreaseAmount,
        {
          from: owner
        }
      );

      expectEvent.inLogs(logs, "WithdrawFreedCollateralSuccessful", {
        user: owner,
        amount: decreaseAmount
      });
    });

    it("reduced freed collateral", async () => {
      const amount = await accountManager.getFreedCollateral(token.address, {
        from: owner
      });
      expect(amount).to.be.bignumber.equal(
        freedCollateralAmount.sub(decreaseAmount)
      );
    });

    it("increased user balance", async () => {
      const balanceAfterWithdraw = await token.balanceOf(owner);

      expect(balanceAfterWithdraw).to.be.bignumber.equal(
        balance.add(decreaseAmount)
      );
    });
  });
});
