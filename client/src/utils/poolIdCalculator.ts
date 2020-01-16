import dayjs = require('dayjs');

export const getCurrentPoolId = () =>
  getPoolIdByTimestamp(new Date().valueOf());

export const getPoolIdByTimestamp = (timestamp: number) =>
  Math.floor(timestamp / 1000 / 3600 / 24);

export const getTimestampByPoolId = (poolId: string) =>
  dayjs(Number.parseInt(poolId, 10) * 3600 * 1000 * 24)
    .endOf('day')
    .valueOf();
