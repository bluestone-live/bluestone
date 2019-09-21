const Protocol = artifacts.require('ProtocolMock');
const DateTime = artifacts.require('DateTime');
const {
  expectRevert,
  expectEvent,
  BN,
  time,
} = require('openzeppelin-test-helpers');
const { expect } = require('chai');
const { createERC20Token, toFixedBN } = require('../../utils/index');

contract('Protocol', function([owner, depositor]) {
  let protocol, datetime;

  beforeEach(async () => {
    protocol = await Protocol.new();
    datetime = await DateTime.new();
  });

  describe('#enableDepositTerm', () => {
    const term = 60;

    context('when term is not enabled', () => {
      it('succeeds', async () => {
        await protocol.enableDepositTerm(term);
        const currTerms = await protocol.getDepositTerms();
        expect(currTerms.length).to.equal(1);
        expect(currTerms.map(term => term.toNumber())).to.contain(term);
      });
    });

    context('when term is enabled', () => {
      beforeEach(async () => {
        await protocol.enableDepositTerm(term);
      });

      it('reverts', async () => {
        await expectRevert(
          protocol.enableDepositTerm(term),
          'DepositManager: term already enabled',
        );
      });
    });
  });

  describe('#disableDepositTerm', () => {
    const term = 60;

    context('when term is enabled', () => {
      beforeEach(async () => {
        await protocol.enableDepositTerm(term);
      });

      it('succeeds', async () => {
        await protocol.disableDepositTerm(term);
        const currTerms = await protocol.getDepositTerms();
        expect(currTerms.length).to.equal(0);
        expect(currTerms.map(term => term.toNumber())).to.not.contain(term);
      });
    });

    context('when term is disabled', () => {
      it('reverts', async () => {
        await expectRevert(
          protocol.disableDepositTerm(term),
          'DepositManager: term already disabled',
        );
      });
    });
  });

  describe('#enableDepositToken', () => {
    const tokenAddress = '0x0000000000000000000000000000000000000001';

    context('when token is not enabled', () => {
      it('succeeds', async () => {
        await protocol.enableDepositToken(tokenAddress);
        const {
          depositTokenAddressList,
          isEnabledList,
        } = await protocol.getDepositTokens();
        expect(depositTokenAddressList.length).to.equal(1);
        expect(isEnabledList.length).to.equal(1);
        expect(depositTokenAddressList[0]).to.equal(tokenAddress);
        expect(isEnabledList[0]).to.equal(true);
      });
    });

    context('when token is enabled', () => {
      beforeEach(async () => {
        await protocol.enableDepositToken(tokenAddress);
      });

      it('reverts', async () => {
        await expectRevert(
          protocol.enableDepositToken(tokenAddress),
          'DepositManager: token already enabled',
        );
      });
    });
  });

  describe('#disableDepositToken', () => {
    const tokenAddress = '0x0000000000000000000000000000000000000001';

    context('when token is enabled', () => {
      beforeEach(async () => {
        await protocol.enableDepositToken(tokenAddress);
      });

      it('succeeds', async () => {
        await protocol.disableDepositToken(tokenAddress);
        const {
          depositTokenAddressList,
          isEnabledList,
        } = await protocol.getDepositTokens();

        expect(depositTokenAddressList.length).to.equal(1);
        expect(isEnabledList.length).to.equal(1);
        expect(depositTokenAddressList[0]).to.equal(tokenAddress);
        expect(isEnabledList[0]).to.equal(false);
      });
    });

    context('when token is disabled', () => {
      it('reverts', async () => {
        await expectRevert(
          protocol.disableDepositToken(tokenAddress),
          'DepositManager: token already disabled',
        );
      });
    });
  });

  describe('#updateDepositMaturity', () => {
    context('when update once within one day', () => {
      const depositTerm = 30;
      let token;

      beforeEach(async () => {
        token = await createERC20Token(owner);
        await protocol.enableDepositToken(token.address);
        await protocol.enableDepositTerm(depositTerm);
        await protocol.addLoanTerm(7);
        await protocol.addLoanTerm(30);
      });

      it('succeeds', async () => {
        const prevPoolGroup = await protocol.getPoolGroup(
          token.address,
          depositTerm,
        );

        await protocol.updateDepositMaturity();

        const currPoolGroup = await protocol.getPoolGroup(
          token.address,
          depositTerm,
        );

        expect(currPoolGroup.firstPoolId).to.bignumber.equal(
          prevPoolGroup.firstPoolId.add(new BN(1)),
        );

        expect(currPoolGroup.lastPoolId).to.bignumber.equal(
          prevPoolGroup.lastPoolId.add(new BN(1)),
        );
      });
    });

    context(
      'when update twice within the same day right before midnight',
      () => {
        beforeEach(async () => {
          await protocol.updateDepositMaturity();
        });

        it('reverts', async () => {
          const now = await time.latest();
          const secondsUntilMidnight = await datetime.secondsUntilMidnight(now);
          await time.increase(time.duration.seconds(secondsUntilMidnight - 10));

          await expectRevert(
            protocol.updateDepositMaturity(),
            'Cannot update multiple times within the same day.',
          );
        });
      },
    );

    context('when update on the next day right after midnight', () => {
      beforeEach(async () => {
        await protocol.updateDepositMaturity();
      });

      it('succeeds', async () => {
        const now = await time.latest();
        const secondsUntilMidnight = await datetime.secondsUntilMidnight(now);
        await time.increase(time.duration.seconds(secondsUntilMidnight + 10));
        await protocol.updateDepositMaturity();
      });
    });
  });

  describe('#deposit', () => {
    const depositAmount = toFixedBN(10);
    const depositTerm = 30;
    let token;

    beforeEach(async () => {
      token = await createERC20Token(depositor);
    });

    context('when token is not enabled', () => {
      it('reverts', async () => {
        await expectRevert(
          protocol.deposit(token.address, depositAmount, depositTerm, {
            from: depositor,
          }),
          'DepositManager: invalid deposit token',
        );
      });
    });

    context('when token is enabled', () => {
      beforeEach(async () => {
        await protocol.enableDepositToken(token.address);
      });

      context('when term is not enabled', () => {
        it('reverts', async () => {
          await expectRevert(
            protocol.deposit(token.address, depositAmount, depositTerm, {
              from: depositor,
            }),
            'DepositManager: invalid deposit term',
          );
        });
      });

      context('when term is enabled', () => {
        beforeEach(async () => {
          await protocol.enableDepositTerm(depositTerm);
        });

        it('succeeds', async () => {
          await token.approve(protocol.address, depositAmount, {
            from: depositor,
          });

          const { logs } = await protocol.deposit(
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
    const depositTerm = 30;
    let token;

    beforeEach(async () => {
      token = await createERC20Token(depositor);
      await protocol.enableDepositToken(token.address);
      await protocol.enableDepositTerm(depositTerm);

      await token.approve(protocol.address, depositAmount, {
        from: depositor,
      });
    });

    context('when deposit is valid', () => {
      let depositId;

      beforeEach(async () => {
        const { logs } = await protocol.deposit(
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
          await protocol.withdraw(depositId, { from: depositor });
        });
      });
    });
    describe('#getDepositById', () => {
      context('when deposit id valid', () => {
        // TODO(ZhangRGK): depends on the deposit method and pool group implements
        it('should get deposit details');
      });

      context('when deposit id invalid', () => {
        it('reverts', async () => {
          await expectRevert(
            protocol.getDepositById(web3.utils.hexToBytes('0x00000000')),
            'DepositManager: Deposit ID is invalid',
          );
        });
      });
    });
    describe('#getDepositById', () => {
      context('when deposit id valid', () => {
        // TODO(ZhangRGK): depends on the deposit method and pool group implements
        it('should get deposit details');
      });

      context('when deposit id invalid', () => {
        it('reverts', async () => {
          await expectRevert(
            protocol.getDepositById(web3.utils.hexToBytes('0x00000000')),
            'DepositManager: Deposit ID is invalid',
          );
        });
      });
    });
  });

  describe('#getDepositsByAccount', () => {
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
        } = await protocol.getDepositRecordsByAccount(otherAccount);
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
      // TODO(ZhangRGK): depends on the deposit method and pool group implements
      it('succeed');
    });
  });
});
