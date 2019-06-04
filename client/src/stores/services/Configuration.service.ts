import { Configuration } from './web3-client';

export const ConfigurationService = {
  getProfitRatio() {
    return Configuration.methods.getProfitRatio().call();
  },
};
