# Deploy to the main network

Create a local.js in config folder:

```
touch config/local.js
```

Save your mnemonic code in local.js:

```
module.exports = {
    mnemonic: 'xxx xxx xxx...'
};
```

Install dependencies:

```
yarn
```

Compile contracts and deploy to main network:

```
npx truffle migrate --reset --network main && ./scripts/bash/setupEnvironment main
```
