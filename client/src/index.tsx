import React from 'react';
import ReactDOM from 'react-dom';
import { store } from './stores';
import * as OfflinePluginRuntime from 'offline-plugin/runtime';
import { Switch, Route, BrowserRouter } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import flatten from './utils/flatten';
import routes from './routes/index';
import { Default } from './layouts';
import Media from 'react-media';
import 'normalize.css';
import 'antd/dist/antd.less';
import './styles/main.less';
import './styles/iconfont/iconfont';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';

dayjs.extend(utc);

if ((window as any).ethereum) {
  (window as any).ethereum.on('networkChanged', () => {
    window.location.reload();
  });
}

export interface IWithMediaPage {
  isMobile: boolean;
}

const App = () => (
  <I18nextProvider i18n={i18n}>
    <ReduxProvider store={store}>
      <BrowserRouter>
        <Switch>
          <Media queries={{ small: { maxWidth: 600 } }}>
            {(matches: any) =>
              flatten(routes(true), 'subRoutes')
                .filter(route => route.path)
                .map(({ component: Component, layout: Layout, ...rest }) => {
                  const renderHandler = (props: any) => {
                    if (Layout) {
                      return (
                        <Layout {...props} title={rest.title}>
                          <Component {...props} isMobile={matches.small} />
                        </Layout>
                      );
                    }
                    return (
                      <Default {...props} title={rest.title}>
                        <Component {...props} isMobile={matches.small} />
                      </Default>
                    );
                  };
                  return (
                    <Route
                      exact
                      key={rest.path}
                      {...rest}
                      render={renderHandler}
                    />
                  );
                })
            }
          </Media>
        </Switch>
      </BrowserRouter>
    </ReduxProvider>
  </I18nextProvider>
);

const mount = async () => {
  const $loading = document.querySelector('.loading');
  if ($loading) {
    document.querySelector('body')!.removeChild($loading);
  }

  ReactDOM.render(<App />, document.getElementById('app'));
};

mount();

if (process.env.NODE_ENV !== 'production') {
  if ((module as any).hot) {
    (module as any).hot.accept();
  }
} else {
  // TODO show upgrading progress
  OfflinePluginRuntime.install({
    onUpdateReady: () => {
      OfflinePluginRuntime.applyUpdate();
    },
    onUpdated: () => {
      window.location.reload();
    },
  });
}
