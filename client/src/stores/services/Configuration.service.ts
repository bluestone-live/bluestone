import { getContracts } from './web3-client';

export const ConfigurationService = {
  async getProfitRatio() {
    const contract = await getContracts();
    return contract.Configuration.methods.getProfitRatio().call();
  },
};
