# Blue Stone Client

## folders

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

## requirements

- nodejs >= 8

## Install Dependencies

```
yarn
```

## Environment Configuration

rename .env.example to .env.dev(for development) or .env.prod(for production)

## Run Dev

```
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
