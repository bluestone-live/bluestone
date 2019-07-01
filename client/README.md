# Client

## Structures

~~~
src
  - components: Dumb components. Cares about how things look.
  - containers: Smart components. Cares about how things work.
  - pages: Page components where each corresponds to a URL route.
  - layouts: Different layouts. for example: `DefaultLayout` for function page, `CoverLayout` for login or MetaMask alert page.
  - routes: react-router configs
  - stores: Mobx stores declares
  - styles: Themes variables
  - utils: some useful utils or helpers
~~~

## Prerequisites

- nodejs >= 8
- Setup root project properly.
- Copy and rename .env.example to .env.dev (for development) or .env.prod (for production)
- Install MetaMask[https://metamask.io/] browser extension.

### Configure MetaMask

Connect MetaMask to local Ganache RPC server:

1. Click on MetaMask extension icon.
2. Click the account icon on top-right corner.
3. Select `Settings` -> `Advacnced`.
4. Find `New Network` and fill in: `http://127.0.0.1:7545`.
5. Click `Save`.

To import a Ganache account:

1. In Ganache Accounts panel, locate the account you want to import.
2. Click on the right-most key icon and copy the private key.
3. Open MetaMask, click the account icon on top-right corner.
4. Click `Import Account`.
5. Paste the private key and click `Import`.

To add a test token:

First, we need to get the token address:

```
npx truffle console
truffle(development)> (await TokenFactory.deployed()).getToken('ETH')
```

Copy the token address.

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

```
yarn
yarn dev
```

## Build for production

```
yarn build
```

## Other Scripts

- lint code

```
yarn lint [--fix]
```

- show compile analyzer

```
yarn analyzer
```

- Update translations

```
yarn translations
```

[edit translations](https://docs.google.com/spreadsheets/d/1l3lNajxq3ppXuYPp5mnlw_EU1i0Q3o1-eLHCv-bqBYM/edit#gid=0)
