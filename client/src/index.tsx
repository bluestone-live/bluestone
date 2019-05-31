import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Container from './containers';
import * as store from './stores';
import * as OfflinePluginRuntime from 'offline-plugin/runtime';
import 'normalize.css';

const mount = async () => {
  // load basic data
  await store.initStore();
  ReactDOM.render(<Container />, document.getElementById('app'));
};
mount();

if (process.env.NODE_ENV !== 'production') {
  if ((module as any).hot) {
    (module as any).hot.accept();
  }
} else {
  OfflinePluginRuntime.install();
}
