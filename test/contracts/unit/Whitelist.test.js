const Whitelist = artifacts.require('Whitelist');

const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract('Whitelist', function ([owner, administrator, depositor, loaner]) {
  let whitelist;
  beforeEach(async () => {
    whitelist = await Whitelist.new();
  });

  context('Keepers: ', () => {
    describe('#addKeeperWhitelisted', () => {
      let tx;
      beforeEach(async () => {
        tx = await whitelist.addKeeperWhitelisted(depositor);
      });
      context('when account is already whitelisted', () => {
        it('revert', async () => {
          await expectRevert(
            whitelist.addKeeperWhitelisted(depositor),
            'Whitelist: keeper account is already whitelisted',
          );
        });
      });

      context('when everything is ok', () => {
        it('succeed', async () => {
          const whitelistedKeepers = await whitelist.getWhitelistedKeepers();
          let addFlag = false;
          whitelistedKeepers.forEach((account) => {
            if (account === depositor) {
              addFlag = true;
            }
          });
          expect(addFlag).to.equal(true);

          const isAdmin = await whitelist.isKeeperWhitelisted(depositor);
          expect(isAdmin).to.equal(true);

          expectEvent.inLogs(tx.logs, 'AddKeeperWhitelisted', {
            account: depositor,
          });
        });
      });
    });

    describe('#removeKeeperWhitelisted', () => {
      context('when account is not whitelisted', () => {
        it('revert', async () => {
          await expectRevert(
            whitelist.removeKeeperWhitelisted(depositor),
            'Whitelist: keeper account is not whitelisted',
          );
        });
      });

      context('when everything is ok', () => {
        it('succeed', async () => {
          await whitelist.addKeeperWhitelisted(depositor);
          let tx = await whitelist.removeKeeperWhitelisted(depositor);
          const whitelistedKeepers = await whitelist.getWhitelistedKeepers();
          let removeFlag = true;
          whitelistedKeepers.forEach((account) => {
            if (account === depositor) {
              removeFlag = false;
            }
          });
          expect(removeFlag).to.equal(true);

          const isAdmin = await whitelist.isKeeperWhitelisted(depositor);
          expect(isAdmin).to.equal(false);

          expectEvent.inLogs(tx.logs, 'RemoveKeeperWhitelisted', {
            account: depositor,
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
