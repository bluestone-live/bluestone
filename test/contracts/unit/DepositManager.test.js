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
  let token, depositManager;
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
    await depositManager.setInterestReserveAddress(interestReserveAddress);
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
        await depositManager.enableDepositToken(ETHIdentificationAddress);
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
          context('when deposit ERC20 tokens', () => {
            let tx, tokenBalanceBefore, tokenBalanceAfter;

            beforeEach(async () => {
              await token.approve(depositManager.address, depositAmount, {
                from: depositor,
              });
              tokenBalanceBefore = new BN(await token.balanceOf(depositor));
              tx = await depositManager.deposit(
                token.address,
                depositAmount,
                depositTerm,
                distributorAddress,
                {
                  from: depositor,
                },
              );
              tokenBalanceAfter = new BN(await token.balanceOf(depositor));
            });

            it('emits DepositSucceed event', async () => {
              expectEvent.inLogs(tx.logs, 'DepositSucceed', {
                accountAddress: depositor,
                amount: depositAmount,
              });
            });

            it('costs depositor depositAmount of tokens', async () => {
              expect(
                tokenBalanceBefore.sub(tokenBalanceAfter),
              ).to.bignumber.equal(depositAmount);
            });
          });

          context('when deposit ETH', () => {
            let tx, ethBalanceBefore, ethBalanceAfter;

            beforeEach(async () => {
              ethBalanceBefore = new BN(await web3.eth.getBalance(depositor));
              tx = await depositManager.deposit(
                ETHIdentificationAddress,
                toFixedBN(0),
                depositTerm,
                distributorAddress,
                {
                  from: depositor,
                  value: depositAmount,
                },
              );
              ethBalanceAfter = new BN(await web3.eth.getBalance(depositor));
            });

            it('emits DepositSucceed event', async () => {
              expectEvent.inLogs(tx.logs, 'DepositSucceed', {
                accountAddress: depositor,
                amount: depositAmount,
              });
            });

            it('costs depositor depositAmount of eth', async () => {
              const gasUsedInWei = new BN(tx.receipt.gasUsed).mul(
                new BN(await web3.eth.getGasPrice()),
              );
              expect(ethBalanceBefore.sub(ethBalanceAfter)).to.bignumber.equal(
                depositAmount.add(gasUsedInWei),
              );
            });
          });
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

    context('when ERC20 deposit record is valid', () => {
      let recordId, tx;

      beforeEach(async () => {
        await token.approve(depositManager.address, depositAmount, {
          from: depositor,
        });
        tx = await depositManager.deposit(
          token.address,
          depositAmount,
          depositTerm,
          distributorAddress,
          {
            from: depositor,
          },
        );

        recordId = tx.logs.filter(log => log.event === 'DepositSucceed')[0].args
          .recordId;
      });

      context('when deposit is matured', () => {
        let depositorTokenBalanceBeforeAction;
        let depositorTokenBalanceAfterAction;
        let distributorTokenBalanceBeforeAction;
        let distributorTokenBalanceAfterAction;

        beforeEach(async () => {
          await time.increase(time.duration.days(depositTerm + 1));

          depositorTokenBalanceBeforeAction = await token.balanceOf(depositor);
          distributorTokenBalanceBeforeAction = await token.balanceOf(
            distributorAddress,
          );
          tx = await depositManager.withdraw(recordId, {
            from: depositor,
          });
          depositorTokenBalanceAfterAction = await token.balanceOf(depositor);
          distributorTokenBalanceAfterAction = await token.balanceOf(
            distributorAddress,
          );
        });

        it('emits WithdrawSucceed event', async () => {
          expectEvent.inLogs(tx.logs, 'WithdrawSucceed', {
            accountAddress: depositor,
            recordId,
          });
        });

        it('sends principal and interest to depositor', async () => {
          const interestForDepositor = (await depositManager.getInterestDistributionByDepositId(
            recordId,
          )).interestForDepositor;

          expect(
            depositorTokenBalanceAfterAction.sub(
              depositorTokenBalanceBeforeAction,
            ),
          ).to.bignumber.equal(depositAmount.add(interestForDepositor));
        });

        it('sends deposit distributor fee to distributor account', async () => {
          const interestForDepositDistributor = (await depositManager.getInterestDistributionByDepositId(
            recordId,
          )).interestForDepositDistributor;

          expect(
            distributorTokenBalanceAfterAction.sub(
              distributorTokenBalanceBeforeAction,
            ),
          ).to.bignumber.equal(interestForDepositDistributor);
        });
      });
    });

    context('when ETH deposit record is valid', () => {
      let recordId, tx;

      beforeEach(async () => {
        tx = await depositManager.deposit(
          ETHIdentificationAddress,
          toFixedBN(0),
          depositTerm,
          distributorAddress,
          {
            from: depositor,
            value: depositAmount,
          },
        );

        recordId = tx.logs.filter(log => log.event === 'DepositSucceed')[0].args
          .recordId;
      });

      context('when deposit is matured', () => {
        let depositorEthBalanceBeforeAction, depositorEthBalanceAfterAction;
        let distributorEthBalanceBeforeAction, distributorEthBalanceAfterAction;

        beforeEach(async () => {
          await time.increase(time.duration.days(depositTerm + 1));

          depositorEthBalanceBeforeAction = new BN(
            await web3.eth.getBalance(depositor),
          );
          distributorEthBalanceBeforeAction = new BN(
            await web3.eth.getBalance(distributorAddress),
          );
          tx = await depositManager.withdraw(recordId, {
            from: depositor,
          });
          depositorEthBalanceAfterAction = new BN(
            await web3.eth.getBalance(depositor),
          );
          distributorEthBalanceAfterAction = new BN(
            await web3.eth.getBalance(distributorAddress),
          );
        });

        it('emits WithdrawSucceed event', async () => {
          expectEvent.inLogs(tx.logs, 'WithdrawSucceed', {
            accountAddress: depositor,
            recordId,
          });
        });

        it('sends principal and interest to depositor', async () => {
          const interestForDepositor = (await depositManager.getInterestDistributionByDepositId(
            recordId,
          )).interestForDepositor;
          const gasUsedInWei = new BN(tx.receipt.gasUsed).mul(
            new BN(await web3.eth.getGasPrice()),
          );

          expect(
            depositorEthBalanceAfterAction.sub(depositorEthBalanceBeforeAction),
          ).to.bignumber.equal(
            depositAmount.add(interestForDepositor).sub(gasUsedInWei),
          );
        });

        it('sent deposit distributor fee to distributor account', async () => {
          const interestForDepositDistributor = (await depositManager.getInterestDistributionByDepositId(
            recordId,
          )).interestForDepositDistributor;

          expect(
            distributorEthBalanceAfterAction.sub(
              distributorEthBalanceBeforeAction,
            ),
          ).to.bignumber.equal(interestForDepositDistributor);
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

    context('when ERC20 deposit record is valid', () => {
      let tx, recordId;

      beforeEach(async () => {
        await token.approve(depositManager.address, depositAmount, {
          from: depositor,
        });
        tx = await depositManager.deposit(
          token.address,
          depositAmount,
          depositTerm,
          distributorAddress,
          {
            from: depositor,
          },
        );

        recordId = tx.logs.filter(log => log.event === 'DepositSucceed')[0].args
          .recordId;
      });

      context('when sender is not record owner', () => {
        it('reverts', async () => {
          await expectRevert(
            depositManager.earlyWithdraw(recordId),
            'DepositManager: invalid owner',
          );
        });
      });

      context('when deposit record is withdrawn', () => {
        beforeEach(async () => {
          await depositManager.earlyWithdraw(recordId, {
            from: depositor,
          });
        });

        it('reverts', async () => {
          await expectRevert(
            depositManager.earlyWithdraw(recordId, {
              from: depositor,
            }),
            'DepositManager: cannot early withdraw',
          );
        });
      });

      context('when deposit record is mature', () => {
        beforeEach(async () => {
          await time.increase(time.duration.days(depositTerm + 1));
        });

        it('reverts', async () => {
          await expectRevert(
            depositManager.earlyWithdraw(recordId, {
              from: depositor,
            }),
            'DepositManager: cannot early withdraw',
          );
        });
      });

      context('when deposit record is early withdrawable', () => {
        let depositorTokenBalanceBeforeAction;
        let depositorTokenBalanceAfterAction;
        let distributorTokenBalanceBeforeAction;
        let distributorTokenBalanceAfterAction;

        beforeEach(async () => {
          depositorTokenBalanceBeforeAction = await token.balanceOf(depositor);
          distributorTokenBalanceBeforeAction = await token.balanceOf(
            distributorAddress,
          );
          tx = await depositManager.earlyWithdraw(recordId, {
            from: depositor,
          });
          depositorTokenBalanceAfterAction = await token.balanceOf(depositor);
          distributorTokenBalanceAfterAction = await token.balanceOf(
            distributorAddress,
          );
        });

        it('emits EarlyWithdrawSucceed event', async () => {
          expectEvent.inLogs(tx.logs, 'EarlyWithdrawSucceed', {
            accountAddress: depositor,
            recordId,
            amount: depositAmount,
          });
        });

        it('sends only principal to depositor', async () => {
          expect(
            depositorTokenBalanceAfterAction.sub(
              depositorTokenBalanceBeforeAction,
            ),
          ).to.bignumber.equal(depositAmount);
        });

        it('does not send deposit distributor fee to distributor account', async () => {
          expect(
            distributorTokenBalanceAfterAction.sub(
              distributorTokenBalanceBeforeAction,
            ),
          ).to.bignumber.equal(new BN(0));
        });
      });
    });

    context('when ETH deposit record is valid', () => {
      let tx, recordId;

      beforeEach(async () => {
        tx = await depositManager.deposit(
          ETHIdentificationAddress,
          toFixedBN(0),
          depositTerm,
          distributorAddress,
          {
            from: depositor,
            value: depositAmount,
          },
        );

        recordId = tx.logs.filter(log => log.event === 'DepositSucceed')[0].args
          .recordId;
      });

      context('when sender is not record owner', () => {
        it('reverts', async () => {
          await expectRevert(
            depositManager.earlyWithdraw(recordId),
            'DepositManager: invalid owner',
          );
        });
      });

      context('when deposit record is withdrawn', () => {
        beforeEach(async () => {
          await depositManager.earlyWithdraw(recordId, {
            from: depositor,
          });
        });

        it('reverts', async () => {
          await expectRevert(
            depositManager.earlyWithdraw(recordId, {
              from: depositor,
            }),
            'DepositManager: cannot early withdraw',
          );
        });
      });

      context('when deposit record is mature', () => {
        beforeEach(async () => {
          await time.increase(time.duration.days(depositTerm + 1));
        });

        it('reverts', async () => {
          await expectRevert(
            depositManager.earlyWithdraw(recordId, {
              from: depositor,
            }),
            'DepositManager: cannot early withdraw',
          );
        });
      });

      context('when deposit record is early withdrawable', () => {
        let depositorEthBalanceBeforeAction;
        let depositorEthBalanceAfterAction;
        let distributorEthBalanceBeforeAction;
        let distributorEthBalanceAfterAction;

        beforeEach(async () => {
          depositorEthBalanceBeforeAction = new BN(
            await web3.eth.getBalance(depositor),
          );
          distributorEthBalanceBeforeAction = new BN(
            await web3.eth.getBalance(distributorAddress),
          );
          tx = await depositManager.earlyWithdraw(recordId, {
            from: depositor,
          });
          depositorEthBalanceAfterAction = new BN(
            await web3.eth.getBalance(depositor),
          );
          distributorEthBalanceAfterAction = new BN(
            await web3.eth.getBalance(distributorAddress),
          );
        });

        it('emits EarlyWithdrawSucceed event', async () => {
          expectEvent.inLogs(tx.logs, 'EarlyWithdrawSucceed', {
            accountAddress: depositor,
            recordId,
            amount: depositAmount,
          });
        });

        it('sends only principal to depositor', async () => {
          const gasUsedInWei = new BN(tx.receipt.gasUsed).mul(
            new BN(await web3.eth.getGasPrice()),
          );

          expect(
            depositorEthBalanceAfterAction.sub(depositorEthBalanceBeforeAction),
          ).to.bignumber.equal(depositAmount.sub(gasUsedInWei));
        });

        it('does not send deposit distributor fee to distributor account', async () => {
          expect(
            distributorEthBalanceAfterAction.sub(
              distributorEthBalanceBeforeAction,
            ),
          ).to.bignumber.equal(new BN(0));
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
