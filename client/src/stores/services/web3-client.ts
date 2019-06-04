const Web3 = require('web3');
const ConfigurationContract = require('../../../build/Configuration.json');
import { AbiItem } from 'web3-utils';

const web3 =
  (global as any).web3.currentProvider && process.env.NODE_ENV === 'production'
    ? new Web3((global as any).web3.currentProvider)
    : new Web3(new Web3.providers.HttpProvider(process.env.WEB3_HTTP_URL));

const contractInstanceFactory = (contract: any) =>
  new web3.eth.Contract(
    contract.abi as AbiItem[],
    contract.networks[web3.eth.net.getId()],
  );

export const Configuration = contractInstanceFactory(ConfigurationContract);
