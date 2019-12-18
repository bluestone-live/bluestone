const _debug = require('debug')('jobs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { CronJob } = require('cron');

const createCronJob = (cronTime, onTick) => {
  const onComplete = null;
  const start = false;
  const timeZone = 'America/Los_Angeles';

  // Documentation: https://github.com/kelektiv/node-cron#api
  return new CronJob(cronTime, onTick, onComplete, start, timeZone);
};

// See more cron schedule expressions examples: https://crontab.guru/examples.html
const CRON_EXP = {
  EVERY_MINUTE: '* * * * *',
  EVERY_MIDNIGHT: '0 0 * * *',
};

/**
 * Post new token prices every minute.
 *
 * Note: This scheduled update mechanism may not be optimal, but it's good enough
 * for demo purpose. Later, we may need to switch to event-based update mechanism,
 * e.g., only update price when the difference between new price and old price
 * is more than 1%, to allow potentially less writes to blockchain.
 * Here's how Maker does it: https://developer.makerdao.com/feeds/
 */
const postTokenPrices = createCronJob(CRON_EXP.EVERY_MINUTE, async () => {
  const debug = _debug.extend('postTokenPrices');
  const { stdout, stderr } = await exec(
    path.resolve(__dirname, '../scripts/bash/postTokenPrices'),
  );
  debug(stdout);
  debug(stderr);
});

// Post Dai price if needed
const postDaiPrice = createCronJob(CRON_EXP.EVERY_MINUTE, async () => {
  const debug = _debug.extend('postDaiPrice');
  const { stdout, stderr } = await exec(
    path.resolve(__dirname, '../scripts/bash/postDaiPrice'),
  );
  debug(stdout);
  debug(stderr);
});

module.exports = {
  postTokenPrices,
  postDaiPrice,
};
