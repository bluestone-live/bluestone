import { MetaMaskProvider } from '../../utils/MetaMaskProvider';
import { PoolsPipe, hideFirstPoolPipe, PoolPipe } from './Pipes';

export class PoolService {
  constructor(private readonly provider: MetaMaskProvider) {}

  async getPoolsByToken(tokenAddress: string) {
    return hideFirstPoolPipe(await this.getMonitorPoolsByToken(tokenAddress));
  }

  async getMonitorPoolsByToken(tokenAddress: string) {
    return PoolsPipe(
      tokenAddress,
      await this.provider.protocol.methods.getPoolsByToken(tokenAddress).call(),
      await this.provider.protocol.methods.getMaxDistributorFeeRatios().call(),
      await this.provider.protocol.methods.getProtocolReserveRatio().call(),
    );
  }

  async getPoolByTokenAndId(tokenAddress: string, poolId: string) {
    return PoolPipe(
      tokenAddress,
      poolId,
      await this.provider.protocol.methods
        .getPoolById(tokenAddress, poolId)
        .call(),
    );
  }
}
