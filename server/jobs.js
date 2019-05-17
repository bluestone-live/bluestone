const { CronJob } = require('cron')
const util = require('util')
const exec = util.promisify(require('child_process').exec)


const createCronJob = (cronTime, onTick) => {
  const onComplete = null
  const start = false
  const timeZone = 'America/Los_Angeles'

  // Documentation: https://github.com/kelektiv/node-cron#api
  return new CronJob(cronTime, onTick, onComplete, start, timeZone)
}

/**
 * Post new token prices every minute.
 *
 * Note: This scheduled update mechanism may not be optimal, but it's good enough
 * for demo purpose. Later, we may need to switch to event-based update mechanism, 
 * e.g., only update price when the difference between new price and old price 
 * is more than 1%, to allow potentially less writes to blockchain.
 * Here's how Maker does it: https://developer.makerdao.com/feeds/
 */
const postTokenPrices = createCronJob('* * * * *', async () => {
  const { stdout, stderr } = await exec('./scripts/bash/postTokenPrices')
  console.log(stdout)
  console.log(stderr)
})

module.exports = {
  postTokenPrices
}
