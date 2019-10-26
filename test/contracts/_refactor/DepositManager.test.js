const DepositManager = artifacts.require('_DepositManagerMock');
const InterestModel = artifacts.require('InterestModel');
const DateTime = artifacts.require('DateTime');
const {
  expectRevert,
  expectEvent,
  BN,
  time,
} = require('openzeppelin-test-helpers');
const { expect } = require('chai');
const { createERC20Token, toFixedBN } = require('../../utils/index');

contract('DepositManager', function([_, depositor]) {
  const depositTerm = 30;
  let token, depositManager, datetime;
  let interestModel;

  beforeEach(async () => {
    depositManager = await DepositManager.new();
    interestModel = await InterestModel.new();
    datetime = await DateTime.new();
    token = await createERC20Token(depositor);
    await depositManager.setInterestModelAddress(interestModel.address);
  });

  describe('#enableDepositTerm', () => {
    const term = 60;

    context('when term is not enabled', () => {
      it('succeeds', async () => {
        await depositManager.enableDepositTerm(term);
        const currTerms = await depositManager.getDepositTerms();
        expect(currTerms.length).to.equal(1);
        expect(currTerms.map(term => term.toNumber())).to.contain(term);
      });
    });

    context('when term is enabled', () => {
      beforeEach(async () => {
        await depositManager.enableDepositTerm(term);
      });

      it('reverts', async () => {
        await expectRevert(
          depositManager.enableDepositTerm(term),
          'DepositManager: term already enabled',
        );
      });
    });
  });

  describe('#disableDepositTerm', () => {
    const term = 60;

    context('when term is enabled', () => {
      beforeEach(async () => {
        await depositManager.enableDepositTerm(term);
      });

      it('succeeds', async () => {
        await depositManager.disableDepositTerm(term);
        const currTerms = await depositManager.getDepositTerms();
        expect(currTerms.length).to.equal(0);
        expect(currTerms.map(term => term.toNumber())).to.not.contain(term);
      });
    });

    context('when term is disabled', () => {
      it('reverts', async () => {
        await expectRevert(
          depositManager.disableDepositTerm(term),
          'DepositManager: term already disabled',
        );
      });
    });
  });

  describe('#enableDepositToken', () => {
    const tokenAddress = '0x0000000000000000000000000000000000000001';

    context('when token is not enabled', () => {
      it('succeeds', async () => {
        await depositManager.enableDepositToken(tokenAddress);
        const {
          depositTokenAddressList,
          isEnabledList,
        } = await depositManager.getDepositTokens();
        expect(depositTokenAddressList.length).to.equal(1);
        expect(isEnabledList.length).to.equal(1);
        expect(depositTokenAddressList[0]).to.equal(tokenAddress);
        expect(isEnabledList[0]).to.equal(true);
      });
    });

    context('when token is enabled', () => {
      beforeEach(async () => {
        await depositManager.enableDepositToken(tokenAddress);
      });

      it('reverts', async () => {
        await expectRevert(
          depositManager.enableDepositToken(tokenAddress),
          'DepositManager: token already enabled',
        );
      });
    });
  });

  describe('#disableDepositToken', () => {
    const tokenAddress = '0x0000000000000000000000000000000000000001';

    context('when token is enabled', () => {
      beforeEach(async () => {
        await depositManager.enableDepositToken(tokenAddress);
      });

      it('succeeds', async () => {
        await depositManager.disableDepositToken(tokenAddress);
        const {
          depositTokenAddressList,
          isEnabledList,
        } = await depositManager.getDepositTokens();

        expect(depositTokenAddressList.length).to.equal(1);
        expect(isEnabledList.length).to.equal(1);
        expect(depositTokenAddressList[0]).to.equal(tokenAddress);
        expect(isEnabledList[0]).to.equal(false);
      });
    });

    context('when token is disabled', () => {
      it('reverts', async () => {
        await expectRevert(
          depositManager.disableDepositToken(tokenAddress),
          'DepositManager: token already disabled',
        );
      });
    });
  });

  describe('#updateDepositMaturity', () => {
    context('when update once within one day', () => {
      const depositTerm = 30;

      beforeEach(async () => {
        await depositManager.enableDepositToken(token.address);
        await depositManager.enableDepositTerm(depositTerm);
      });

      it('succeeds', async () => {
        const prevPoolGroup = await depositManager.getPoolGroup(token.address);

        await depositManager.updateDepositMaturity();

        const currPoolGroup = await depositManager.getPoolGroup(token.address);

        expect(currPoolGroup.firstPoolId).to.bignumber.equal(
          prevPoolGroup.firstPoolId.add(new BN(1)),
        );
      });
    });

    context(
      'when update twice within the same day right before midnight',
      () => {
        beforeEach(async () => {
          await depositManager.updateDepositMaturity();
        });

        it('reverts', async () => {
          const now = await time.latest();
          const secondsUntilMidnight = await datetime.secondsUntilMidnight(now);
          await time.increase(time.duration.seconds(secondsUntilMidnight - 10));

          await expectRevert(
            depositManager.updateDepositMaturity(),
            'Cannot update multiple times within the same day.',
          );
        });
      },
    );

    context('when update on the next day right after midnight', () => {
      beforeEach(async () => {
        await depositManager.updateDepositMaturity();
      });

      it('succeeds', async () => {
        const now = await time.latest();
        const secondsUntilMidnight = await datetime.secondsUntilMidnight(now);
        await time.increase(time.duration.seconds(secondsUntilMidnight + 10));
        await depositManager.updateDepositMaturity();
      });
    });
  });

  describe('#deposit', () => {
    const depositAmount = toFixedBN(10);
    const depositTerm = 30;

    context('when token is not enabled', () => {
      it('reverts', async () => {
        await expectRevert(
          depositManager.deposit(token.address, depositAmount, depositTerm, {
            from: depositor,
          }),
          'DepositManager: invalid deposit token',
        );
      });
    });

    context('when token is enabled', () => {
      beforeEach(async () => {
        await depositManager.enableDepositToken(token.address);
      });

      context('when term is not enabled', () => {
        it('reverts', async () => {
          await expectRevert(
            depositManager.deposit(token.address, depositAmount, depositTerm, {
              from: depositor,
            }),
            'DepositManager: invalid deposit term',
          );
        });
      });

      context('when term is enabled', () => {
        beforeEach(async () => {
          await depositManager.enableDepositTerm(depositTerm);
        });

        it('succeeds', async () => {
          await token.approve(depositManager.address, depositAmount, {
            from: depositor,
          });

          const { logs } = await depositManager.deposit(
            token.address,
            depositAmount,
            depositTerm,
            {
              from: depositor,
            },
          );

          expectEvent.inLogs(logs, 'DepositSucceed', {
            accountAddress: depositor,
          });
        });
      });
    });
  });

  describe('#withdraw', () => {
    const depositAmount = toFixedBN(10);

    beforeEach(async () => {
      await depositManager.enableDepositToken(token.address);
      await depositManager.enableDepositTerm(depositTerm);

      await token.approve(depositManager.address, depositAmount, {
        from: depositor,
      });
    });

    context('when deposit is valid', () => {
      let depositId;

      beforeEach(async () => {
        const { logs } = await depositManager.deposit(
          token.address,
          depositAmount,
          depositTerm,
          {
            from: depositor,
          },
        );

        depositId = logs.filter(log => log.event === 'DepositSucceed')[0].args
          .depositId;
      });

      context('when deposit is matured', () => {
        beforeEach(async () => {
          await time.increase(time.duration.days(depositTerm + 1));
        });

        it('succeeds', async () => {
          await depositManager.withdraw(depositId, { from: depositor });
        });
      });
    });
  });

  describe('#earlyWithdraw', () => {
    const depositAmount = toFixedBN(10);

    beforeEach(async () => {
      await depositManager.enableDepositToken(token.address);
      await depositManager.enableDepositTerm(depositTerm);

      await token.approve(depositManager.address, depositAmount, {
        from: depositor,
      });
    });

    context('when deposit is valid', () => {
      let depositId;

      beforeEach(async () => {
        const { logs } = await depositManager.deposit(
          token.address,
          depositAmount,
          depositTerm,
          {
            from: depositor,
          },
        );

        depositId = logs.filter(log => log.event === 'DepositSucceed')[0].args
          .depositId;
      });

      context('when deposit is not matured', () => {
        it('succeeds', async () => {
          await depositManager.earlyWithdraw(depositId, {
            from: depositor,
          });
        });
      });
    });
  });

  describe('#getDepositTokens', () => {
    it('succeeds');
  });

  describe('#getDepositRecordById', () => {
    let depositId;
    const depositAmount = toFixedBN(10);

    beforeEach(async () => {
      await depositManager.enableDepositToken(token.address);
      await depositManager.enableDepositTerm(depositTerm);

      await token.approve(depositManager.address, depositAmount, {
        from: depositor,
      });

      const { logs } = await depositManager.deposit(
        token.address,
        depositAmount,
        depositTerm,
        {
          from: depositor,
        },
      );
      depositId = logs.filter(log => log.event === 'DepositSucceed')[0].args
        .depositId;
    });

    context('when deposit id valid', () => {
      it('should get deposit details', async () => {
        const deposit = await depositManager.getDepositRecordById(depositId);
        expect(deposit.tokenAddress).to.equal(token.address);
        expect(deposit.depositTerm).to.bignumber.equal(new BN(depositTerm));
        expect(deposit.depositAmount).to.bignumber.equal(depositAmount);
        expect(deposit.isMatured).to.be.false;
        expect(deposit.isWithdrawn).to.be.false;
      });
    });

    context('when deposit id invalid', () => {
      it('reverts', async () => {
        await expectRevert(
          depositManager.getDepositRecordById(
            web3.utils.hexToBytes('0x00000000'),
          ),
          'DepositManager: Deposit ID is invalid',
        );
      });
    });
  });

  describe('#getDepositInterestById', () => {
    let depositId;
    const depositAmount = toFixedBN(10);

    beforeEach(async () => {
      await depositManager.enableDepositToken(token.address);
      await depositManager.enableDepositTerm(depositTerm);

      await token.approve(depositManager.address, depositAmount, {
        from: depositor,
      });

      const { logs } = await depositManager.deposit(
        token.address,
        depositAmount,
        depositTerm,
        {
          from: depositor,
        },
      );
      depositId = logs.filter(log => log.event === 'DepositSucceed')[0].args
        .depositId;
    });

    context('when deposit id valid', () => {
      it('should get interest earned by deposit', async () => {
        const interest = await depositManager.getDepositInterestById(depositId);

        const { poolId } = await depositManager.getDepositRecordById(depositId);
        const protocolReserveRatio = toFixedBN(0.15);
        const {
          depositAmount: totalDepositAmount,
          loanInterest,
        } = await depositManager.getPoolById(token.address, poolId);

        const expectedInterest = loanInterest
          .div(totalDepositAmount)
          .sub(loanInterest.div(depositAmount).mul(protocolReserveRatio))
          .mul(depositAmount);

        expect(interest).to.bignumber.equal(expectedInterest);
      });
    });

    context('when deposit id invalid', () => {
      it('reverts', async () => {
        await expectRevert(
          depositManager.getDepositInterestById(
            web3.utils.hexToBytes('0x00000000'),
          ),
          'DepositManager: Deposit ID is invalid',
        );
      });
    });
  });

  describe('#getDepositRecordsByAccount', () => {
    context("when user didn't have any deposit records", () => {
      it('should return empty resultSet', async () => {
        const {
          depositIdList,
          tokenAddressList,
          depositTermList,
          depositAmountList,
          createdAtList,
          maturedAtList,
          withdrewAtList,
        } = await depositManager.getDepositRecordsByAccount(depositor);
        expect(depositIdList.length).to.equal(0);
        expect(tokenAddressList.length).to.equal(0);
        expect(depositTermList.length).to.equal(0);
        expect(depositAmountList.length).to.equal(0);
        expect(createdAtList.length).to.equal(0);
        expect(maturedAtList.length).to.equal(0);
        expect(withdrewAtList.length).to.equal(0);
      });
    });

    context('when user have deposit records', () => {
      it('succeed');
    });
  });

  describe('#isDepositEarlyWithdrawable', () => {
    it('succeeds');
  });

  describe('#_getInterestIndexFromDaysAgo', () => {
    it('succeeds');
  });
});
