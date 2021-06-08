const _debug = require('debug')('script:utils');
const fs = require('fs');
const path = require('path');
const Immutable = require('seamless-immutable');
const { BN } = require('web3-utils');

const constants = {
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
};

const getNetworkFile = (network) =>
  path.join(__dirname, '..', 'networks', `${network}.json`);

const loadNetwork = (network) => {
  const debug = _debug.extend('loadNetwork');
  const filePath = getNetworkFile(network);

  debug('Loading network file...');

  try {
    const content = fs.readFileSync(filePath);
    debug('Existing network file found.');
    return Immutable(JSON.parse(content));
  } catch (err) {
    debug('No network file found, return empty json object.');
    return Immutable({});
  }
};

const saveNetwork = (network, path, value) => {
  const debug = _debug.extend('saveNetwork');

  const filePath = getNetworkFile(network);
  const prevNetworkConfig = loadNetwork(network);
  const updatedNetworkConfig = Immutable.setIn(prevNetworkConfig, path, value);

  debug('Merging network file...');
  fs.writeFileSync(
    filePath,
    `${JSON.stringify(updatedNetworkConfig, null, 2)}\n`,
  );
};

// Deploy a contract and save contract address
const deploy = async (deployer, network, contract, saveToPath, ...args) => {
  const debug = _debug.extend('deploy');
  const contractName = contract._json.contractName;

  debug(`Deploying ${contractName}...`);
  await deployer.deploy(contract, ...args);

  const deployedContract = await contract.deployed();
  const path = saveToPath || ['contracts', contractName];
  saveNetwork(network, path, deployedContract.address);

  debug(`Deployed ${contractName} at ${deployedContract.address}.`);

  return deployedContract.address;
};

const getTokenAddress = async (tokenSymbol) => {
  const debug = _debug.extend('getTokenAddress');
  const network = loadNetwork('development');
  const tokenAddress = network['tokens'][tokenSymbol].address;

  if (tokenAddress === constants.ZERO_ADDRESS) {
    throw `Token ${tokenSymbol} must be deployed first.`;
  }

  debug(`Got deployed ${tokenSymbol} address: ${tokenAddress}`);

  return tokenAddress;
};

// This function reduces boilerplates code we need to write external scripts
// for truffle and outputs useful debugging info. It accepts a function that
// contains main scripting logic and returns another function to be
// executed by truffle.
const makeTruffleScript = (fn) => {
  const debug = _debug.extend('makeTruffleScript');

  // The following function will be executed by truffle, the first argument
  // must be a callback function according to the doc:
  // https://truffleframework.com/docs/truffle/getting-started/writing-external-scripts
  return async (callback = () => {}, ...restArgs) => {
    const isInvokedFromCmd = process.argv[2] === 'exec';

    let args;

    if (isInvokedFromCmd) {
      // Get script name from full path
      const scriptName = process.argv[4].replace(/^.*[\\\/]/, '');
      debug('Script name: %s', scriptName);

      // Get arguments from command line
      args = process.argv.slice(5);
    } else {
      // Get arguments from test suite
      args = restArgs;
    }

    debug('Received arguments: %o', args);

    try {
      debug('Executing...');
      const res = await fn(...args);
      debug('Done!');
      callback();
      return res ? res : true;
    } catch (err) {
      debug(err);
      callback();
      return false;
    }
  };
};

function toFixedBN(num, significant = 18) {
  let decimalPlaces = (num.toString().split('.')[1] || []).length;

  if (decimalPlaces === 0) {
    return new BN(num).mul(new BN(10).pow(new BN(significant)));
  } else {
    const integer = num * Math.pow(10, decimalPlaces);
    return new BN(integer).mul(
      new BN(10).pow(new BN(significant - decimalPlaces)),
    );
  }
}

module.exports = {
  constants,
  getTokenAddress,
  makeTruffleScript,
  loadNetwork,
  saveNetwork,
  deploy,
  toFixedBN,
};
