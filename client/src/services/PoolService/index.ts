import { MetaMaskProvider } from '../../utils/MetaMaskProvider';
import { PoolsPipe } from './Pipes';

export class PoolService {
  constructor(private readonly provider: MetaMaskProvider) {}

  async getDetailsFromAllPools(tokenAddress: string) {
    return PoolsPipe(
      await this.provider.protocol.methods
        .getDetailsFromAllPools(tokenAddress)
        .call(),
    );
  }
}
