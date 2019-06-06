// const ethereum = (global as any).ethereum;
// the new ethereum provider api didn't support user logout event, so we have to use global web3 provider now
const publicConfigStore = (global as any).web3.currentProvider
  .publicConfigStore;

export const onAccountsChanged = (callback: (...args: any[]) => any) =>
  publicConfigStore.on('update', callback);

export const offAccountsChanged = () => publicConfigStore.off('update');
