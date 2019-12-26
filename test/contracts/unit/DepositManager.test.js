const DepositManager = artifacts.require('DepositManagerMock');
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

contract('DepositManager', function([
  _,
  depositor,
  distributorAddress,
  protocolAddress,
]) {
  const depositTerm = 30;
  const depositDistributorFeeRatio = toFixedBN(0.01);
  const loanDistributorFeeRatio = toFixedBN(0.02);
  let token, depositManager, datetime;
  let interestModel;

  beforeEach(async () => {
    depositManager = await DepositManager.new();
    interestModel = await InterestModel.new();
    datetime = await DateTime.new();
    token = await createERC20Token(depositor);
    await depositManager.setInterestModel(interestModel.address);
    await depositManager.setMaxDistributorFeeRatios(
      depositDistributorFeeRatio,
      loanDistributorFeeRatio,
    );
    await depositManager.setProtocolAddress(protocolAddress);
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
        const depositTokenAddressList = await depositManager.getDepositTokens();
        expect(depositTokenAddressList.length).to.equal(1);
        expect(depositTokenAddressList[0]).to.equal(tokenAddress);
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
        const depositTokenAddressList = await depositManager.getDepositTokens();

        expect(depositTokenAddressList.length).to.equal(0);
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

  describe('#deposit', () => {
    const depositAmount = toFixedBN(10);
    const depositTerm = 30;

    context('when token is not enabled', () => {
      it('reverts', async () => {
        await expectRevert(
          depositManager.deposit(
            token.address,
            depositAmount,
            depositTerm,
            distributorAddress,
            {
              from: depositor,
            },
          ),
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
            depositManager.deposit(
              token.address,
              depositAmount,
              depositTerm,
              distributorAddress,
              {
                from: depositor,
              },
            ),
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
            distributorAddress,
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
      let recordId;

      beforeEach(async () => {
        const { logs } = await depositManager.deposit(
          token.address,
          depositAmount,
          depositTerm,
          distributorAddress,
          {
            from: depositor,
          },
        );

        recordId = logs.filter(log => log.event === 'DepositSucceed')[0].args
          .recordId;
      });

      context('when deposit is matured', () => {
        let originalBalanceInDistributorAccount;
        let interestForDepositor;

        beforeEach(async () => {
          await time.increase(time.duration.days(depositTerm + 1));
          originalBalanceInDistributorAccount = await token.balanceOf(
            distributorAddress,
          );
          interestForDepositor = (await depositManager.getInterestDistributionByDepositId(
            recordId,
          )).interestForDepositor;
        });

        it('succeeds', async () => {
          await depositManager.withdraw(recordId, {
            from: depositor,
          });
        });

        it('sent deposit distributor fee to distributor account', async () => {
          const estimateDistributorBalance = originalBalanceInDistributorAccount.add(
            interestForDepositor.mul(toFixedBN(0.01)),
          );
          expect(await token.balanceOf(distributorAddress)).to.bignumber.equal(
            estimateDistributorBalance,
          );
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
      let recordId;

      beforeEach(async () => {
        const { logs } = await depositManager.deposit(
          token.address,
          depositAmount,
          depositTerm,
          distributorAddress,
          {
            from: depositor,
          },
        );

        recordId = logs.filter(log => log.event === 'DepositSucceed')[0].args
          .recordId;
      });

      context('when deposit is not matured', () => {
        it('succeeds', async () => {
          await depositManager.earlyWithdraw(recordId, {
            from: depositor,
          });
        });
      });
    });
  });

  describe('#getDepositTokens', () => {
    beforeEach(async () => {
      await depositManager.enableDepositToken(token.address);
    });

    it('succeeds', async () => {
      const depositTokenAddressList = await depositManager.getDepositTokens();
      expect(depositTokenAddressList.length).to.equal(1);
      expect(depositTokenAddressList[0]).to.equal(token.address);
    });
  });

  describe('#getDepositRecordById', () => {
    let recordId;
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
        distributorAddress,
        {
          from: depositor,
        },
      );
      recordId = logs.filter(log => log.event === 'DepositSucceed')[0].args
        .recordId;
    });

    context('when deposit id valid', () => {
      it('should get deposit details', async () => {
        const deposit = await depositManager.getDepositRecordById(recordId);
        expect(deposit.tokenAddress).to.equal(token.address);
        expect(new BN(deposit.depositTerm)).to.bignumber.equal(
          new BN(depositTerm),
        );
        expect(new BN(deposit.depositAmount)).to.bignumber.equal(depositAmount);
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

  describe('#getInterestDistributionByDepositId', () => {
    let recordId;
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
        distributorAddress,
        {
          from: depositor,
        },
      );
      recordId = logs.filter(log => log.event === 'DepositSucceed')[0].args
        .recordId;
    });

    context('when deposit id valid', () => {
      it('should get interest earned by deposit', async () => {
        const {
          interestForDepositor,
        } = await depositManager.getInterestDistributionByDepositId(recordId);

        const { poolId } = await depositManager.getDepositRecordById(recordId);
        const protocolReserveRatio = toFixedBN(0.15);
        const {
          depositAmount: totalDepositAmount,
          loanInterest,
        } = await depositManager.getPoolById(token.address, poolId);

        const expectedInterest = loanInterest
          .div(totalDepositAmount)
          .sub(loanInterest.div(depositAmount).mul(protocolReserveRatio))
          .mul(depositAmount);

        expect(interestForDepositor).to.bignumber.equal(expectedInterest);
      });
    });

    context('when deposit id invalid', () => {
      it('reverts', async () => {
        await expectRevert(
          depositManager.getInterestDistributionByDepositId(
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
        const depositRecordList = await depositManager.getDepositRecordsByAccount(
          depositor,
        );
        expect(depositRecordList.length).to.equal(0);
      });
    });

    context('when user have deposit records', () => {
      const depositAmount = toFixedBN(10);
      const depositTerm = 30;
      let recordId;

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
          distributorAddress,
          {
            from: depositor,
          },
        );
        recordId = logs.filter(log => log.event === 'DepositSucceed')[0].args
          .recordId;
      });

      it('succeed', async () => {
        const depositRecordList = await depositManager.getDepositRecordsByAccount(
          depositor,
        );
        expect(depositRecordList.length).to.equal(1);
      });
    });
  });

  describe('#isDepositEarlyWithdrawable', () => {
    const depositAmount = toFixedBN(10);
    const depositTerm = 30;
    let recordId;

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
        distributorAddress,
        {
          from: depositor,
        },
      );
      recordId = logs.filter(log => log.event === 'DepositSucceed')[0].args
        .recordId;
    });

    it('succeeds', async () => {
      const isDepositEarlyWithdrawable = await depositManager.isDepositEarlyWithdrawable(
        recordId,
      );

      expect(isDepositEarlyWithdrawable).to.be.true;
    });
  });
});
