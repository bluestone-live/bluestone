const AccountManager = artifacts.require("AccountManager");
const TokenManager = artifacts.require("TokenManager");
const { createERC20Token, toFixedBN } = require("../../utils/index.js");
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
        increaseAmount,
        {
          from: owner
        }
      );
      const amount = await accountManager.getFreedCollateral(token.address, {
        from: owner
      });
      expect(amount).to.be.bignumber.equal(increaseAmount);
    });

    after(async () => {
      await accountManager.decreaseFreedCollateral(
        token.address,
        increaseAmount,
        {
          from: owner
        }
      );
    });
  });
  describe("#decreaseFreedCollateral", () => {
    before(async () => {
      await accountManager.increaseFreedCollateral(
        token.address,
        increaseAmount,
        {
          from: owner
        }
      );
    });
    it("succeeds", async () => {
      await accountManager.decreaseFreedCollateral(
        token.address,
        decreaseAmount,
        {
          from: owner
        }
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
        increaseAmount,
        {
          from: owner
        }
      );
      freedCollateralAmount = await accountManager.getFreedCollateral(
        token.address,
        {
          from: owner
        }
      );
    });

    it("succeeds", async () => {
      await accountManager.withdrawFreedCollateral(
        token.address,
        decreaseAmount,
        {
          from: owner
        }
      );
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
