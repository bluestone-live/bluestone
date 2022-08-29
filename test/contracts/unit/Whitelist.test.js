const Whitelist = artifacts.require('Whitelist');

const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract('Whitelist', function ([owner, administrator, depositor, loaner]) {
  let whitelist;
  beforeEach(async () => {
    whitelist = await Whitelist.new();
  });
  describe('#constructor', () => {
    it('when everything is ok', async () => {
      const admins = await whitelist.getAdministrators();
      const isAdmin = await whitelist.isAdministrator(owner);
      expect(admins[0]).to.equal(owner);
      expect(isAdmin).to.equal(true);
    });
  });

  context('Administrators: ', () => {
    describe('#addAdministrator', () => {
      context('when signer is already a administrator', () => {
        it('revert', async () => {
          await expectRevert(
            whitelist.addAdministrator(owner),
            'Whitelist: account is already administrator',
          );
        });
      });

      context('when everything is ok', () => {
        it('succeed', async () => {
          let tx = await whitelist.addAdministrator(administrator);
          const administrators = await whitelist.getAdministrators();
          let addFlag = false;
          administrators.forEach((account) => {
            if (account === administrator) {
              addFlag = true;
            }
          });
          expect(addFlag).to.equal(true);

          const isAdmin = await whitelist.isAdministrator(administrator);
          expect(isAdmin).to.equal(true);

          expectEvent.inLogs(tx.logs, 'AddAdministrator', {
            account: administrator,
          });
        });
      });
    });

    describe('#removeAdministrator', () => {
      context('when account is not administrator', () => {
        it('revert', async () => {
          await expectRevert(
            whitelist.removeAdministrator(administrator),
            'Whitelist: account is not administrator',
          );
        });
      });

      context('when account is owner', () => {
        it('revert', async () => {
          await expectRevert(
            whitelist.removeAdministrator(owner),
            'Whitelist: can not remove owner from administrators',
          );
        });
      });

      context('when everything is ok', () => {
        it('succeed', async () => {
          await whitelist.addAdministrator(administrator);
          let tx = await whitelist.removeAdministrator(administrator);
          const administrators = await whitelist.getAdministrators();
          let removeFlag = true;
          administrators.forEach((account) => {
            if (account === administrator) {
              removeFlag = false;
            }
          });
          expect(removeFlag).to.equal(true);

          const isAdmin = await whitelist.isAdministrator(administrator);
          expect(isAdmin).to.equal(false);

          expectEvent.inLogs(tx.logs, 'RemoveAdministrator', {
            account: administrator,
          });
        });
      });
    });
  });

  context('Depositors/Lenders: ', () => {
    describe('#addLenderWhitelisted', () => {
      let tx;
      beforeEach(async () => {
        tx = await whitelist.addLenderWhitelisted(depositor);
      });
      context('when account is already whitelisted', () => {
        it('revert', async () => {
          await expectRevert(
            whitelist.addLenderWhitelisted(depositor),
            'Whitelist: lender account is already whitelisted',
          );
        });
      });

      context('when everything is ok', () => {
        it('succeed', async () => {
          const whitelistedLenders = await whitelist.getWhitelistedLenders();
          let addFlag = false;
          whitelistedLenders.forEach((account) => {
            if (account === depositor) {
              addFlag = true;
            }
          });
          expect(addFlag).to.equal(true);

          const isAdmin = await whitelist.isLenderWhitelisted(depositor);
          expect(isAdmin).to.equal(true);

          expectEvent.inLogs(tx.logs, 'AddLenderWhitelisted', {
            account: depositor,
          });
        });
      });
    });

    describe('#removeLenderWhitelisted', () => {
      context('when account is not whitelisted', () => {
        it('revert', async () => {
          await expectRevert(
            whitelist.removeLenderWhitelisted(depositor),
            'Whitelist: lender account is not whitelisted',
          );
        });
      });

      context('when everything is ok', () => {
        it('succeed', async () => {
          await whitelist.addLenderWhitelisted(depositor);
          let tx = await whitelist.removeLenderWhitelisted(depositor);
          const whitelistedLenders = await whitelist.getWhitelistedLenders();
          let removeFlag = true;
          whitelistedLenders.forEach((account) => {
            if (account === depositor) {
              removeFlag = false;
            }
          });
          expect(removeFlag).to.equal(true);

          const isAdmin = await whitelist.isLenderWhitelisted(depositor);
          expect(isAdmin).to.equal(false);

          expectEvent.inLogs(tx.logs, 'RemoveLenderWhitelisted', {
            account: depositor,
          });
        });
      });
    });
  });

  context('Loaners/Borrowers: ', () => {
    describe('#addBorrowerWhitelisted', () => {
      let tx;
      beforeEach(async () => {
        tx = await whitelist.addBorrowerWhitelisted(loaner);
      });
      context('when account is already whitelisted', () => {
        it('revert', async () => {
          await expectRevert(
            whitelist.addBorrowerWhitelisted(loaner),
            'Whitelist: borrower account is already whitelisted',
          );
        });
      });

      context('when everything is ok', () => {
        it('succeed', async () => {
          const whitelistedBorrowers =
            await whitelist.getWhitelistedBorrowers();
          let addFlag = false;
          whitelistedBorrowers.forEach((account) => {
            if (account === loaner) {
              addFlag = true;
            }
          });
          expect(addFlag).to.equal(true);

          const isAdmin = await whitelist.isBorrowerWhitelisted(loaner);
          expect(isAdmin).to.equal(true);

          expectEvent.inLogs(tx.logs, 'AddBorrowerWhitelisted', {
            account: loaner,
          });
        });
      });
    });

    describe('#removeBorrowerWhitelisted', () => {
      context('when account is not whitelisted', () => {
        it('revert', async () => {
          await expectRevert(
            whitelist.removeBorrowerWhitelisted(loaner),
            'Whitelist: borrower account is not whitelisted',
          );
        });
      });

      context('when everything is ok', () => {
        it('succeed', async () => {
          await whitelist.addBorrowerWhitelisted(loaner);
          let tx = await whitelist.removeBorrowerWhitelisted(loaner);
          const whitelistedBorrowers =
            await whitelist.getWhitelistedBorrowers();
          let removeFlag = true;
          whitelistedBorrowers.forEach((account) => {
            if (account === loaner) {
              removeFlag = false;
            }
          });
          expect(removeFlag).to.equal(true);

          const isAdmin = await whitelist.isBorrowerWhitelisted(loaner);
          expect(isAdmin).to.equal(false);

          expectEvent.inLogs(tx.logs, 'RemoveBorrowerWhitelisted', {
            account: loaner,
          });
        });
      });
    });
  });
});
