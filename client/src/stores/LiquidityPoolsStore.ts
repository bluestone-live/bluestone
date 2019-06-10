import { getPoolGroup } from './services/LiquidityPoolsService';
import { tokenStore } from './index';

export class LiquidityPoolsStore {
  async getPoolGroup(tokenSymbol: string, term: number) {
    const token = tokenStore.getToken(tokenSymbol);
    if (token) {
      const poolGroup = await getPoolGroup(token.address, term);
      return poolGroup;
    }
    return null;
  }
}
