const DepositManager = artifacts.require('DepositManagerMock');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const InterestModel = artifacts.require('InterestModel');
const DateTime = artifacts.require('DateTime');
const {
  expectRevert,
  expectEvent,
  BN,
  time,
} = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const {
  createERC20Token,
  toFixedBN,
  ETHIdentificationAddress,
} = require('../../utils/index');

contract(
  'DepositManager',
  function ([
    owner,
    administrator,
    depositor,
    loaner,
    distributorAddress,
    interestReserveAddress,
  ]) {
    const depositTerm = 30;
    const depositDistributorFeeRatio = toFixedBN(0.01);
    const loanDistributorFeeRatio = toFixedBN(0.02);
    const balanceCap = toFixedBN(150);
    let token, depositManager, interestModel, datetime;

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
      await depositManager.setBalanceCap(token.address, balanceCap);
      await depositManager.setBalanceCap(ETHIdentificationAddress, balanceCap);
    });

    describe('#enableDepositTerm', () => {
      const term = 60;

      context('when term is not enabled', () => {
        it('succeeds', async () => {
          await depositManager.enableDepositTerm(term);
          const currTerms = await depositManager.getDepositTerms();
          expect(currTerms.map((term) => term.toNumber())).to.contain(term);
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

    describe('#enableDepositTerms', () => {
      context('when terms is empty', () => {
        it('reverts', async () => {
          await expectRevert(
            depositManager.enableDepositTerms([]),
            'DepositManager: empty terms',
          );
        });
      });

      context('when all terms are not enabled', () => {
        const terms = [10, 20, 30];

        it('succeeds', async () => {
          await depositManager.enableDepositTerms(terms);
          const currTerms = await depositManager.getDepositTerms();
          terms.forEach((term) =>
            expect(currTerms.map((term) => term.toNumber())).to.contain(term),
          );
        });
      });

      context('when one or more terms given are enabled', () => {
        const terms = [10, 20, 30];
        const enabledTerm = 30;

        beforeEach(async () => {
          await depositManager.enableDepositTerm(enabledTerm);
        });

        it('reverts', async () => {
          await expectRevert(
            depositManager.enableDepositTerms(terms),
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
          expect(currTerms.map((term) => term.toNumber())).to.not.contain(term);
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

    describe('#disableDepositTerms', () => {
      context('when terms is empty', () => {
        it('reverts', async () => {
          await expectRevert(
            depositManager.disableDepositTerms([]),
            'DepositManager: empty terms',
          );
        });
      });

      context('when all terms are enabled', () => {
        const terms = [10, 20, 30];

        beforeEach(async () => {
          await depositManager.enableDepositTerms(terms);
        });

        it('succeeds', async () => {
          await depositManager.disableDepositTerms(terms);
          const currTerms = await depositManager.getDepositTerms();
          terms.forEach((term) =>
            expect(currTerms.map((term) => term.toNumber())).to.not.contain(
              term,
            ),
          );
        });
      });

      context('when one or more terms given are disabled', () => {
        const terms = [10, 20, 30];
        const disabledTerm = 30;

        beforeEach(async () => {
          await depositManager.enableDepositTerms(terms);
          await depositManager.disableDepositTerm(disabledTerm);
        });

        it('reverts', async () => {
          await expectRevert(
            depositManager.disableDepositTerms(terms),
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
          const depositTokenAddressList =
            await depositManager.getDepositTokens();
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
          const depositTokenAddressList =
            await depositManager.getDepositTokens();
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
      const ethDepositAmount = toFixedBN(0.01);
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

          context('if balance cap is exceeded after the transaction', () => {
            const balanceCapPlusOne = balanceCap.add(new BN(1));

            context('when deposit ERC20 tokens', () => {
              it('reverts', async () => {
                await expectRevert(
                  depositManager.deposit(
                    token.address,
                    balanceCapPlusOne,
                    depositTerm,
                    distributorAddress,
                    {
                      from: depositor,
                    },
                  ),
                  'DepositManager: token balance cap exceeded',
                );
              });
            });

            context('when deposit ETH', () => {
              it('reverts', async () => {
                await expectRevert(
                  depositManager.deposit(
                    ETHIdentificationAddress,
                    balanceCapPlusOne,
                    depositTerm,
                    distributorAddress,
                    {
                      from: depositor,
                      value: balanceCapPlusOne,
                    },
                  ),
                  'DepositManager: token balance cap exceeded',
                );
              });
            });
          });

          context('if balance cap is reached after the transaction', () => {
            let tx;

            context('when deposit ERC20 tokens', () => {
              beforeEach(async () => {
                await token.approve(depositManager.address, balanceCap, {
                  from: depositor,
                });
                tx = await depositManager.deposit(
                  token.address,
                  balanceCap,
                  depositTerm,
                  distributorAddress,
                  {
                    from: depositor,
                  },
                );
              });

              it('emits DepositSucceed event', async () => {
                expectEvent.inLogs(tx.logs, 'DepositSucceed', {
                  accountAddress: depositor,
                  amount: balanceCap,
                });
              });
            });

            context('when deposit ETH', () => {
              beforeEach(async () => {
                tx = await depositManager.deposit(
                  ETHIdentificationAddress,
                  ethDepositAmount,
                  depositTerm,
                  distributorAddress,
                  {
                    from: depositor,
                    value: ethDepositAmount,
                  },
                );
              });

              it('emits DepositSucceed event', async () => {
                expectEvent.inLogs(tx.logs, 'DepositSucceed', {
                  accountAddress: depositor,
                  amount: ethDepositAmount,
                });
              });
            });
          });

          context(
            'when deposit ETH with different depositAmount than msg.value',
            () => {
              it('reverts', async () => {
                await expectRevert(
                  depositManager.deposit(
                    ETHIdentificationAddress,
                    ethDepositAmount.add(new BN(1)),
                    depositTerm,
                    distributorAddress,
                    {
                      from: depositor,
                      value: ethDepositAmount,
                    },
                  ),
                  'DepositManager: depositAmount must be equal to msg.value',
                );
              });
            },
          );

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
                  ethDepositAmount,
                  depositTerm,
                  distributorAddress,
                  {
                    from: depositor,
                    value: ethDepositAmount,
                  },
                );
                ethBalanceAfter = new BN(await web3.eth.getBalance(depositor));
              });

              it('emits DepositSucceed event', async () => {
                expectEvent.inLogs(tx.logs, 'DepositSucceed', {
                  accountAddress: depositor,
                  amount: ethDepositAmount,
                });
              });

              it('costs depositor depositAmount of eth', async () => {
                const gasUsedInWei = new BN(tx.receipt.gasUsed).mul(
                  new BN(await web3.eth.getGasPrice()),
                );
                expect(
                  ethBalanceBefore.sub(ethBalanceAfter),
                ).to.bignumber.equal(ethDepositAmount.add(gasUsedInWei));
              });
            });
          });
        });
      });
    });

    describe('#withdraw', () => {
      const depositAmount = toFixedBN(10);
      const ethDepositAmount = toFixedBN(0.01);

      beforeEach(async () => {
        await depositManager.enableDepositToken(token.address);
        await depositManager.enableDepositToken(ETHIdentificationAddress);
        await depositManager.enableDepositTerm(depositTerm);
      });

      context('when deposit record is invalid', () => {
        it('reverts', async () => {
          await expectRevert(
            depositManager.withdraw(web3.utils.asciiToHex('0x00000000'), {
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

          recordId = tx.logs.filter((log) => log.event === 'DepositSucceed')[0]
            .args.recordId;
        });

        context('when pool available amount is insufficient', () => {
          let priceOracle, collateralPriceOracle;
          let collateralToken;

          beforeEach(async () => {
            priceOracle = await SingleFeedPriceOracle.new();
            collateralPriceOracle = await SingleFeedPriceOracle.new();
            collateralToken = await createERC20Token(loaner, toFixedBN(1000));
            await priceOracle.setPrice(toFixedBN(10));
            await collateralPriceOracle.setPrice(toFixedBN(10));
            await depositManager.setPriceOracle(
              token.address,
              priceOracle.address,
            );
            await depositManager.setPriceOracle(
              collateralToken.address,
              collateralPriceOracle.address,
            );
            await depositManager.setLoanAndCollateralTokenPair(
              token.address,
              collateralToken.address,
              toFixedBN(1.5),
              toFixedBN(0.05),
            );
            await token.approve(depositManager.address, toFixedBN(1000), {
              from: loaner,
            });
            await collateralToken.approve(
              depositManager.address,
              toFixedBN(1000),
              {
                from: loaner,
              },
            );

            const loanAmount = toFixedBN(10);
            const collateralAmount = toFixedBN(20);
            await depositManager.loan(
              token.address,
              collateralToken.address,
              loanAmount,
              collateralAmount,
              1,
              distributorAddress,
              {
                from: loaner,
              },
            );

            await time.increase(time.duration.days(depositTerm + 1));
            // When the loan is matured but not repaid, there is insufficient
            // amount for withdrawal.
          });

          it('fails to withdraw', async () => {
            await expectRevert(
              depositManager.withdraw(recordId, {
                from: depositor,
              }),
              'DepositManager: insufficient available amount for withdrawal',
            );
          });
        });

        context('when deposit is matured', () => {
          let depositorTokenBalanceBeforeAction;
          let depositorTokenBalanceAfterAction;
          let distributorTokenBalanceBeforeAction;
          let distributorTokenBalanceAfterAction;
          let poolBeforeAction;
          let poolAfterAction;

          beforeEach(async () => {
            await time.increase(time.duration.days(depositTerm + 1));

            depositorTokenBalanceBeforeAction = await token.balanceOf(
              depositor,
            );
            distributorTokenBalanceBeforeAction = await token.balanceOf(
              distributorAddress,
            );
            const poolId = (await depositManager.getDepositRecordById(recordId))
              .poolId;
            poolBeforeAction = await depositManager.getPoolById(
              token.address,
              poolId,
            );

            tx = await depositManager.withdraw(recordId, {
              from: depositor,
            });
            depositorTokenBalanceAfterAction = await token.balanceOf(depositor);
            distributorTokenBalanceAfterAction = await token.balanceOf(
              distributorAddress,
            );
            poolAfterAction = await depositManager.getPoolById(
              token.address,
              poolId,
            );
          });

          it('emits WithdrawSucceed event', async () => {
            expectEvent.inLogs(tx.logs, 'WithdrawSucceed', {
              accountAddress: depositor,
              recordId,
            });
          });

          it('sends principal and interest to depositor', async () => {
            const interestForDepositor = (
              await depositManager.getInterestDistributionByDepositId(recordId)
            ).interestForDepositor;

            expect(
              depositorTokenBalanceAfterAction.sub(
                depositorTokenBalanceBeforeAction,
              ),
            ).to.bignumber.equal(depositAmount.add(interestForDepositor));
          });

          it('sends deposit distributor fee to distributor account', async () => {
            const interestForDepositDistributor = (
              await depositManager.getInterestDistributionByDepositId(recordId)
            ).interestForDepositDistributor;

            expect(
              distributorTokenBalanceAfterAction.sub(
                distributorTokenBalanceBeforeAction,
              ),
            ).to.bignumber.equal(interestForDepositDistributor);
          });

          it('removes principal, interest, distributor fee and protocol fee from the pool', async () => {
            const {
              interestForDepositor,
              interestForDepositDistributor,
              interestForProtocolReserve,
            } = await depositManager.getInterestDistributionByDepositId(
              recordId,
            );
            expect(new BN(poolAfterAction.availableAmount)).to.bignumber.equal(
              new BN(poolBeforeAction.availableAmount)
                .sub(depositAmount)
                .sub(interestForDepositor)
                .sub(interestForDepositDistributor)
                .sub(interestForProtocolReserve),
            );
          });
        });
      });

      context('when ETH deposit record is valid', () => {
        let recordId, tx;

        beforeEach(async () => {
          tx = await depositManager.deposit(
            ETHIdentificationAddress,
            ethDepositAmount,
            depositTerm,
            distributorAddress,
            {
              from: depositor,
              value: ethDepositAmount,
            },
          );

          recordId = tx.logs.filter((log) => log.event === 'DepositSucceed')[0]
            .args.recordId;
        });

        context('when pool available amount is insufficient', () => {
          let priceOracle, collateralPriceOracle;
          let collateralToken;

          beforeEach(async () => {
            priceOracle = await SingleFeedPriceOracle.new();
            collateralPriceOracle = await SingleFeedPriceOracle.new();
            collateralToken = await createERC20Token(loaner, toFixedBN(1000));
            await priceOracle.setPrice(toFixedBN(10));
            await collateralPriceOracle.setPrice(toFixedBN(10));
            await depositManager.setPriceOracle(
              ETHIdentificationAddress,
              priceOracle.address,
            );
            await depositManager.setPriceOracle(
              collateralToken.address,
              collateralPriceOracle.address,
            );
            await depositManager.setLoanAndCollateralTokenPair(
              ETHIdentificationAddress,
              collateralToken.address,
              toFixedBN(1.5),
              toFixedBN(0.05),
            );
            await collateralToken.approve(
              depositManager.address,
              toFixedBN(1000),
              {
                from: loaner,
              },
            );

            const loanAmount = toFixedBN(0.01);
            const collateralAmount = toFixedBN(20);
            await depositManager.loan(
              ETHIdentificationAddress,
              collateralToken.address,
              loanAmount,
              collateralAmount,
              1,
              distributorAddress,
              {
                from: loaner,
              },
            );

            await time.increase(time.duration.days(depositTerm + 1));
            // When the loan is matured but not repaid, there is insufficient
            // amount for withdrawal.
          });

          it('fails to withdraw', async () => {
            await expectRevert(
              depositManager.withdraw(recordId, {
                from: depositor,
              }),
              'DepositManager: insufficient available amount for withdrawal',
            );
          });
        });

        context('when deposit is matured', () => {
          let depositorEthBalanceBeforeAction, depositorEthBalanceAfterAction;
          let distributorEthBalanceBeforeAction,
            distributorEthBalanceAfterAction;
          let poolBeforeAction, poolAfterAction;

          let interestForProtocolReserve;
          let interestForDepositDistributor;

          beforeEach(async () => {
            await time.increase(time.duration.days(depositTerm + 1));
            originalBalanceInDistributorAccount = await token.balanceOf(
              distributorAddress,
            );

            const interest =
              await depositManager.getInterestDistributionByDepositId(recordId);

            interestForDepositor = interest.interestForDepositor;
            interestForProtocolReserve = interest.interestForProtocolReserve;
            interestForDepositDistributor =
              interest.interestForDepositDistributor;

            depositorEthBalanceBeforeAction = new BN(
              await web3.eth.getBalance(depositor),
            );
            distributorEthBalanceBeforeAction = new BN(
              await web3.eth.getBalance(distributorAddress),
            );
            const poolId = (await depositManager.getDepositRecordById(recordId))
              .poolId;
            poolBeforeAction = await depositManager.getPoolById(
              ETHIdentificationAddress,
              poolId,
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
            poolAfterAction = await depositManager.getPoolById(
              ETHIdentificationAddress,
              poolId,
            );
          });

          it('emits WithdrawSucceed event', async () => {
            expectEvent.inLogs(tx.logs, 'WithdrawSucceed', {
              accountAddress: depositor,
              recordId,
            });

            expectEvent.inLogs(tx.logs, 'WithdrawSucceed', {
              accountAddress: depositor,
            });

            expectEvent.inLogs(tx.logs, 'InterestReserveTransferred', {
              recordId: recordId,
              interestForProtocolReserve: new BN(interestForProtocolReserve),
            });

            expectEvent.inLogs(tx.logs, 'DepositDistributorFeeTransferred', {
              recordId: recordId,
              interestForDistributor: new BN(interestForDepositDistributor),
            });
          });

          it('sends principal and interest to depositor', async () => {
            const interestForDepositor = (
              await depositManager.getInterestDistributionByDepositId(recordId)
            ).interestForDepositor;
            const gasUsedInWei = new BN(tx.receipt.gasUsed).mul(
              new BN(await web3.eth.getGasPrice()),
            );

            expect(
              depositorEthBalanceAfterAction.sub(
                depositorEthBalanceBeforeAction,
              ),
            ).to.bignumber.equal(
              ethDepositAmount.add(interestForDepositor).sub(gasUsedInWei),
            );
          });

          it('sent deposit distributor fee to distributor account', async () => {
            const interestForDepositDistributor = (
              await depositManager.getInterestDistributionByDepositId(recordId)
            ).interestForDepositDistributor;

            expect(
              distributorEthBalanceAfterAction.sub(
                distributorEthBalanceBeforeAction,
              ),
            ).to.bignumber.equal(interestForDepositDistributor);
          });

          it('removes principal, interest, distributor fee and protocol fee from the pool', async () => {
            const {
              interestForDepositor,
              interestForDepositDistributor,
              interestForProtocolReserve,
            } = await depositManager.getInterestDistributionByDepositId(
              recordId,
            );
            expect(new BN(poolAfterAction.availableAmount)).to.bignumber.equal(
              new BN(poolBeforeAction.availableAmount)
                .sub(ethDepositAmount)
                .sub(interestForDepositor)
                .sub(interestForDepositDistributor)
                .sub(interestForProtocolReserve),
            );
          });
        });
      });
    });

    describe('#earlyWithdraw', () => {
      const depositAmount = toFixedBN(10);
      const ethDepositAmount = toFixedBN(0.01);

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

          recordId = tx.logs.filter((log) => log.event === 'DepositSucceed')[0]
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
            depositorTokenBalanceBeforeAction = await token.balanceOf(
              depositor,
            );
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
            ethDepositAmount,
            depositTerm,
            distributorAddress,
            {
              from: depositor,
              value: ethDepositAmount,
            },
          );

          recordId = tx.logs.filter((log) => log.event === 'DepositSucceed')[0]
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
              amount: ethDepositAmount,
            });
          });

          it('sends only principal to depositor', async () => {
            const gasUsedInWei = new BN(tx.receipt.gasUsed).mul(
              new BN(await web3.eth.getGasPrice()),
            );

            expect(
              depositorEthBalanceAfterAction.sub(
                depositorEthBalanceBeforeAction,
              ),
            ).to.bignumber.equal(ethDepositAmount.sub(gasUsedInWei));
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
        recordId = logs.filter((log) => log.event === 'DepositSucceed')[0].args
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
              web3.utils.asciiToHex('0x00000000'),
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
        recordId = logs.filter((log) => log.event === 'DepositSucceed')[0].args
          .recordId;
      });

      context('when deposit id valid', () => {
        it('should get interest earned by depositor', async () => {
          const { interestForDepositor } =
            await depositManager.getInterestDistributionByDepositId(recordId);

          const { poolId } = await depositManager.getDepositRecordById(
            recordId,
          );
          const protocolReserveRatio = toFixedBN(0.15);
          const { depositAmount: totalDepositAmount, loanInterest } =
            await depositManager.getPoolById(token.address, poolId);

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
              web3.utils.asciiToHex('0x00000000'),
            ),
            'DepositManager: invalid deposit ID',
          );
        });
      });
    });

    describe('#getDepositRecordsByAccount', () => {
      context('when user does not have any deposit records', () => {
        it('should return empty result', async () => {
          const depositRecordList =
            await depositManager.getDepositRecordsByAccount(depositor);
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
          const depositRecordList =
            await depositManager.getDepositRecordsByAccount(depositor);
          expect(depositRecordList.length).to.equal(numOfDepositRecords);
        });
      });
    });

    describe('#isDepositEarlyWithdrawable', () => {
      context('when deposit id invalid', () => {
        it('returns false', async () => {
          const isDepositEarlyWithdrawable =
            await depositManager.isDepositEarlyWithdrawable(
              web3.utils.asciiToHex('0x00000000'),
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
          recordId = logs.filter((log) => log.event === 'DepositSucceed')[0]
            .args.recordId;
        });

        context('when deposit record is withdrew', () => {
          beforeEach(async () => {
            await depositManager.earlyWithdraw(recordId, {
              from: depositor,
            });
          });

          it('returns false', async () => {
            const isDepositEarlyWithdrawable =
              await depositManager.isDepositEarlyWithdrawable(recordId);
            expect(isDepositEarlyWithdrawable).to.be.false;
          });
        });

        context('when deposit record is mature', () => {
          beforeEach(async () => {
            await time.increase(time.duration.days(depositTerm + 1));
          });

          it('returns false', async () => {
            const isDepositEarlyWithdrawable =
              await depositManager.isDepositEarlyWithdrawable(recordId);
            expect(isDepositEarlyWithdrawable).to.be.false;
          });
        });

        context('when deposit record is early withdrawable', () => {
          it('returns true', async () => {
            const isDepositEarlyWithdrawable =
              await depositManager.isDepositEarlyWithdrawable(recordId);

            expect(isDepositEarlyWithdrawable).to.be.true;
          });
        });
      });
    });
  },
);
