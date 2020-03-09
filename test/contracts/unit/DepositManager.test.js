const DepositManager = artifacts.require('DepositManagerMock');
const PayableProxy = artifacts.require('PayableProxy');
const InterestModel = artifacts.require('InterestModel');
const DateTime = artifacts.require('DateTime');
const WETH9 = artifacts.require('WETH9');
const {
  expectRevert,
  expectEvent,
  BN,
  time,
} = require('openzeppelin-test-helpers');
const { expect } = require('chai');
const {
  createERC20Token,
  toFixedBN,
  ETHIdentificationAddress,
} = require('../../utils/index');

contract('DepositManager', function([
  owner,
  depositor,
  distributorAddress,
  interestReserveAddress,
]) {
  const depositTerm = 30;
  const depositDistributorFeeRatio = toFixedBN(0.01);
  const loanDistributorFeeRatio = toFixedBN(0.02);
  let token, depositManager, payableProxy;
  let interestModel;

  beforeEach(async () => {
    depositManager = await DepositManager.new();
    interestModel = await InterestModel.new();
    datetime = await DateTime.new();
    token = await createERC20Token(depositor);
    weth = await WETH9.new();
    await depositManager.setInterestModel(interestModel.address);
    await depositManager.setMaxDistributorFeeRatios(
      depositDistributorFeeRatio,
      loanDistributorFeeRatio,
    );
    await depositManager.setInterestReserveAddress(interestReserveAddress);
    payableProxy = await PayableProxy.new(depositManager.address, weth.address);

    await depositManager.setPayableProxy(payableProxy.address);
  });

  describe('#enableDepositTerm', () => {
    const term = 60;

    context('when term is not enabled', () => {
      it('succeeds', async () => {
        await depositManager.enableDepositTerm(term);
        const currTerms = await depositManager.getDepositTerms();
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
    const tokenAddress = '0x0000000000000000000000000000000000000002';

    context('when token is not enabled', () => {
      it('succeeds', async () => {
        await depositManager.enableDepositToken(tokenAddress);
        const depositTokenAddressList = await depositManager.getDepositTokens();
        expect(depositTokenAddressList).to.contain(tokenAddress);
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
    const tokenAddress = '0x0000000000000000000000000000000000000002';

    context('when token is enabled', () => {
      beforeEach(async () => {
        await depositManager.enableDepositToken(tokenAddress);
      });

      it('succeeds', async () => {
        await depositManager.disableDepositToken(tokenAddress);
        const depositTokenAddressList = await depositManager.getDepositTokens();
        expect(depositTokenAddressList).to.not.contain(tokenAddress);
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

        context('when distributor address is invalid', () => {
          it('reverts', async () => {
            const tokenAddress = '0x0000000000000000000000000000000000000000';
            await expectRevert(
              depositManager.deposit(
                token.address,
                depositAmount,
                depositTerm,
                tokenAddress,
                {
                  from: depositor,
                },
              ),
              'DepositManager: invalid distributor address',
            );
          });
        });

        context('when distributor address is valid', () => {
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

      // TODO: revisit after removing PayableProxy
      context('when deposit ETH', () => {
        beforeEach(async () => {
          await depositManager.enableDepositTerm(depositTerm);
          await depositManager.enableDepositToken(ETHIdentificationAddress);
        });

        it('succeeds', async () => {
          const originalWETHBalanceOfProtocol = await weth.balanceOf(
            depositManager.address,
          );

          const { logs } = await depositManager.deposit(
            ETHIdentificationAddress,
            toFixedBN(0),
            depositTerm,
            distributorAddress,
            {
              from: depositor,
              value: depositAmount,
            },
          );

          const WETHBalanceOfProtocol = await weth.balanceOf(
            depositManager.address,
          );

          expectEvent.inLogs(logs, 'DepositSucceed', {
            accountAddress: depositor,
          });
          expect(
            WETHBalanceOfProtocol.sub(originalWETHBalanceOfProtocol),
          ).to.bignumber.equal(depositAmount);
        });
      });
    });
  });

  describe('#withdraw', () => {
    const depositAmount = toFixedBN(10);

    beforeEach(async () => {
      await depositManager.enableDepositToken(token.address);
      await depositManager.enableDepositToken(ETHIdentificationAddress);
      await depositManager.enableDepositTerm(depositTerm);
    });

    context('when deposit record is invalid', () => {
      it('reverts', async () => {
        await expectRevert(
          depositManager.withdraw(web3.utils.hexToBytes('0x00000000'), {
            from: depositor,
          }),
          'DepositManager: invalid deposit ID',
        );
      });
    });

    context('when deposit record is valid', () => {
      let recordId;
      let ETHRecordId;

      beforeEach(async () => {
        await token.approve(depositManager.address, depositAmount, {
          from: depositor,
        });
        const { logs: logs1 } = await depositManager.deposit(
          token.address,
          depositAmount,
          depositTerm,
          distributorAddress,
          {
            from: depositor,
          },
        );

        recordId = logs1.filter(log => log.event === 'DepositSucceed')[0].args
          .recordId;

        const { logs: logs2 } = await depositManager.deposit(
          ETHIdentificationAddress,
          toFixedBN(0),
          depositTerm,
          distributorAddress,
          {
            from: depositor,
            value: depositAmount,
          },
        );

        ETHRecordId = logs2.filter(log => log.event === 'DepositSucceed')[0]
          .args.recordId;
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
          const { logs: logs1 } = await depositManager.withdraw(recordId, {
            from: depositor,
          });
          expectEvent.inLogs(logs1, 'WithdrawSucceed', {
            accountAddress: depositor,
          });

          const { logs: logs2 } = await depositManager.withdraw(ETHRecordId, {
            from: depositor,
          });
          expectEvent.inLogs(logs2, 'WithdrawSucceed', {
            accountAddress: depositor,
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
      await depositManager.enableDepositToken(ETHIdentificationAddress);
      await depositManager.enableDepositTerm(depositTerm);
    });

    context('when deposit is valid', () => {
      let recordId;
      let ETHRecordId;

      beforeEach(async () => {
        await token.approve(depositManager.address, depositAmount, {
          from: depositor,
        });
        const { logs: logs1 } = await depositManager.deposit(
          token.address,
          depositAmount,
          depositTerm,
          distributorAddress,
          {
            from: depositor,
          },
        );

        recordId = logs1.filter(log => log.event === 'DepositSucceed')[0].args
          .recordId;

        const { logs: logs2 } = await depositManager.deposit(
          ETHIdentificationAddress,
          toFixedBN(0),
          depositTerm,
          distributorAddress,
          {
            from: depositor,
            value: depositAmount,
          },
        );

        ETHRecordId = logs2.filter(log => log.event === 'DepositSucceed')[0]
          .args.recordId;
      });

      context('when sender is not record owner', () => {
        it('reverts', async () => {
          await expectRevert(
            depositManager.earlyWithdraw(recordId),
            'DepositManager: invalid owner',
          );
        });
      });

      context('when deposit is not matured', () => {
        it('succeeds', async () => {
          const { logs: logs1 } = await depositManager.earlyWithdraw(recordId, {
            from: depositor,
          });

          expectEvent.inLogs(logs1, 'EarlyWithdrawSucceed', {
            accountAddress: depositor,
          });

          const { logs: logs2 } = await depositManager.earlyWithdraw(
            ETHRecordId,
            {
              from: depositor,
            },
          );

          expectEvent.inLogs(logs2, 'EarlyWithdrawSucceed', {
            accountAddress: depositor,
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
        expect(deposit.depositId).to.equal(recordId);
        expect(deposit.tokenAddress).to.equal(token.address);
        expect(new BN(deposit.depositTerm)).to.bignumber.equal(
          new BN(depositTerm),
        );
        expect(new BN(deposit.depositAmount)).to.bignumber.equal(
          new BN(depositAmount),
        );
      });
    });

    context('when deposit id invalid', () => {
      it('reverts', async () => {
        await expectRevert(
          depositManager.getDepositRecordById(
            web3.utils.hexToBytes('0x00000000'),
          ),
          'DepositManager: invalid deposit ID',
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
      it('should get interest earned by depositor', async () => {
        const {
          interestForDepositor,
        } = await depositManager.getInterestDistributionByDepositId(recordId);

        const { poolId } = await depositManager.getDepositRecordById(recordId);
        const protocolReserveRatio = toFixedBN(0.15);
        const {
          depositAmount: totalDepositAmount,
          loanInterest,
        } = await depositManager.getPoolById(token.address, poolId);

        const expectedInterest = new BN(loanInterest).sub(
          new BN(loanInterest).div(depositAmount).mul(protocolReserveRatio),
        );

        expect(interestForDepositor).to.bignumber.equal(expectedInterest);
      });
    });

    context('when deposit id invalid', () => {
      it('reverts', async () => {
        await expectRevert(
          depositManager.getInterestDistributionByDepositId(
            web3.utils.hexToBytes('0x00000000'),
          ),
          'DepositManager: invalid deposit ID',
        );
      });
    });
  });

  describe('#getDepositRecordsByAccount', () => {
    context('when user does not have any deposit records', () => {
      it('should return empty result', async () => {
        const depositRecordList = await depositManager.getDepositRecordsByAccount(
          depositor,
        );
        expect(depositRecordList.length).to.equal(0);
      });
    });

    context('when user has deposit records', () => {
      const depositAmount = toFixedBN(10);
      const depositTerm = 30;
      const numOfDepositRecords = 3;

      beforeEach(async () => {
        await depositManager.enableDepositToken(token.address);
        await depositManager.enableDepositTerm(depositTerm);
        for (let i = 0; i < numOfDepositRecords; i++) {
          await token.approve(depositManager.address, depositAmount, {
            from: depositor,
          });

          await depositManager.deposit(
            token.address,
            depositAmount,
            depositTerm,
            distributorAddress,
            {
              from: depositor,
            },
          );
        }
      });

      it('succeed', async () => {
        const depositRecordList = await depositManager.getDepositRecordsByAccount(
          depositor,
        );
        expect(depositRecordList.length).to.equal(numOfDepositRecords);
      });
    });
  });

  describe('#isDepositEarlyWithdrawable', () => {
    context('when deposit id invalid', () => {
      it('returns false', async () => {
        const isDepositEarlyWithdrawable = await depositManager.isDepositEarlyWithdrawable(
          web3.utils.hexToBytes('0x00000000'),
        );
        expect(isDepositEarlyWithdrawable).to.be.false;
      });
    });

    context('when deposit id is valid', () => {
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

      context('when deposit record is withdrew', () => {
        beforeEach(async () => {
          await depositManager.earlyWithdraw(recordId, {
            from: depositor,
          });
        });

        it('returns false', async () => {
          const isDepositEarlyWithdrawable = await depositManager.isDepositEarlyWithdrawable(
            recordId,
          );
          expect(isDepositEarlyWithdrawable).to.be.false;
        });
      });

      context('when deposit record is mature', () => {
        beforeEach(async () => {
          await time.increase(time.duration.days(depositTerm + 1));
        });

        it('returns false', async () => {
          const isDepositEarlyWithdrawable = await depositManager.isDepositEarlyWithdrawable(
            recordId,
          );
          expect(isDepositEarlyWithdrawable).to.be.false;
        });
      });

      context('when deposit record is early withdrawable', () => {
        it('returns true', async () => {
          const isDepositEarlyWithdrawable = await depositManager.isDepositEarlyWithdrawable(
            recordId,
          );

          expect(isDepositEarlyWithdrawable).to.be.true;
        });
      });
    });
  });
});
