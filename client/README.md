# Client

This is the web client for BlueStone built on [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/).

## Project Structure

In `src` directory:

- components: Semantic components. Combine and customize UI library components. Cares about how things look.
- containers: Smart components. Maintaining component states, dispatch actions. Cares about how things work.
- pages: Page components where each corresponds to a URL route.
- layouts: Different layouts. for example: `DefaultLayout` for function page, `CoverLayout` for login or MetaMask alert page.
- routes: Router configs.
- stores: Redux stores.
- services: Services that interacts with the contract.
  - Pipes: Functions that transform input data to the desired output.
- styles: Themes variables and customize styles
  - main.less: Styles entry file. Put all styles imports into it.
  - theme.js: Theme variable override declarations. reference: [style variables](https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less)

## Prerequisites

- nodejs >= 8
- Setup root project properly.
- Copy and rename .env.example to .env.dev (for development) or .env.prod (for production)
- Install MetaMask[https://metamask.io/] browser extension.

### Configure MetaMask

Connect MetaMask to local Ganache RPC server:

1. Click on MetaMask extension icon.
2. Click the account icon on top-right corner.
3. Select `Settings` -> `Advanced`.
4. Find `New Network` and fill in: `http://127.0.0.1:7545`.
5. Click `Save`.

To import a Ganache account:

1. Check stdout in terminal, find `Private Keys`, locate the private key you want to import. (the first three accounts have test token balance)
2. Open MetaMask, click the account icon on top-right corner.
3. Click `Import Account`.
4. Paste the private key and click `Import`.

To add a test token:

First, we copy the token address from `network.json` in project root.

Next, add this token to MetaMask:

1. Click on MetaMask extension icon.
2. Click the hamburger menu on top-left coner.
3. Click `Add Token` at the bottom.
4. Select `Custom Token` tab.
5. Paste the token address. You should see other fields automatically being filled out.
6. Click `Next` and finally `Add Tokens`.

You should be able to see the test token being added with some balance.

This is a rather curbersome process, so we need to automate it later on.

## Development

Install dependencies and start dev server:

```
yarn
yarn dev
```

## Deployment

Make a production build:

```
yarn build
```

Deploy to dev server:

```
yarn run deploy:dev
```
