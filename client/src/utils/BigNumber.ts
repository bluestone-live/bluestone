const originalBN = require('bn.js');

export type BigNumber = typeof originalBN;
export const BN = originalBN;
