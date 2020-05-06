import dayjs = require('dayjs');

export const getCurrentPoolId = () =>
  getPoolIdByTimestamp(new Date().valueOf());

export const getPoolIdByTimestamp = (timestamp: number) =>
  Math.floor(timestamp / 1000 / 3600 / 24);

export const getTimestampByPoolId = (poolId: string) =>
  dayjs
    .utc((Number.parseInt(poolId, 10) + 1) * 3600 * 1000 * 24)
    .local()
    .endOf('day')
    .valueOf();
