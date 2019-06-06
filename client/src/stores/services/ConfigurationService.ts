import { getContracts } from './Web3Service';

export const ConfigurationService = {
  async getProfitRatio() {
    const contract = await getContracts();
    return contract.Configuration.methods.getProfitRatio().call();
  },
};
