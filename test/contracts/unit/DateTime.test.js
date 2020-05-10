const DateTime = artifacts.require('DateTime');
const { BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const DAY_IN_SECONDS = 86400;

contract('DateTime', () => {
  let datetime;

  before(async () => {
    datetime = await DateTime.new();
  });

  describe('#getHour', () => {
    require('./testcases/DateTime/getHour.js').forEach(({ args, expected }) => {
      it(`returns ${expected}`, async () => {
        expect(await datetime.getHour.apply(null, args)).to.be.bignumber.equal(
          new BN(expected),
        );
      });
    });
  });

  describe('#getMinute', () => {
    require('./testcases/DateTime/getMinute.js').forEach(
      ({ args, expected }) => {
        it(`returns ${expected}`, async () => {
          expect(
            await datetime.getMinute.apply(null, args),
          ).to.be.bignumber.equal(new BN(expected));
        });
      },
    );
  });

  describe('#getSecond', () => {
    require('./testcases/DateTime/getSecond.js').forEach(
      ({ args, expected }) => {
        it(`returns ${expected}`, async () => {
          expect(
            await datetime.getSecond.apply(null, args),
          ).to.be.bignumber.equal(new BN(expected));
        });
      },
    );
  });

  describe('#secondsUntilMidnight', () => {
    it('returns 1', async () => {
      // Friday, December 31, 1971 11:59:59 PM
      expect(
        await datetime.secondsUntilMidnight(63071999),
      ).to.be.bignumber.equal(new BN(1));
    });

    it('returns 36001', async () => {
      // Saturday, January 1, 1972 1:59:59 PM
      const expected = DAY_IN_SECONDS - 13 * 3600 - 59 * 60 - 59;
      expect(
        await datetime.secondsUntilMidnight(63122399),
      ).to.be.bignumber.equal(new BN(expected));
    });

    it('returns 86400', async () => {
      // Saturday, January 1, 1972 12:00:00 AM
      expect(
        await datetime.secondsUntilMidnight(63072000),
      ).to.be.bignumber.equal(new BN(DAY_IN_SECONDS));
    });
  });

  describe('#toDays', () => {
    it('returns 0', async () => {
      expect(await datetime.toDays(86399)).to.be.bignumber.equal(new BN(0));
    });

    it('returns 1', async () => {
      expect(await datetime.toDays(86400)).to.be.bignumber.equal(new BN(1));
    });

    it('returns 2', async () => {
      expect(await datetime.toDays(172800)).to.be.bignumber.equal(new BN(2));
    });
  });
});
