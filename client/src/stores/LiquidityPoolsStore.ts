import { getPoolGroup } from './services/LiquidityPoolsService';
import { tokenStore } from './index';
import { BigNumber } from '../utils/BigNumber';

export class LiquidityPoolsStore {
  async getPoolGroup(tokenSymbol: string, term: BigNumber) {
    const token = tokenStore.getToken(tokenSymbol);
    if (token) {
      const poolGroup = await getPoolGroup(token.address, term);
      return poolGroup;
    }
    return null;
  }
}
