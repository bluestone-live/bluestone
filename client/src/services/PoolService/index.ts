import { MetaMaskProvider } from '../../utils/MetaMaskProvider';
import { PoolsPipe, hideFirstPoolPipe } from './Pipes';

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
}
