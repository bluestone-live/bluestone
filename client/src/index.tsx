import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { store } from './stores';
import * as OfflinePluginRuntime from 'offline-plugin/runtime';
import { Switch, Route, BrowserRouter } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from 'styled-components';
import i18n from './i18n';
import flatten from './utils/flatten';
import routes from './routes';
import { Default } from './layouts';
import { DefaultTheme } from './styles/themes';
import NotFound from './components/common/NotFound';
import 'normalize.css';

const renderError = (ErrorComponent: React.ComponentType) => (props: any) => (
  <Default {...props}>
    <ErrorComponent />
  </Default>
);

const App = () => (
  <I18nextProvider i18n={i18n}>
    <ReduxProvider store={store}>
      <ThemeProvider theme={DefaultTheme}>
        <BrowserRouter>
          <Switch>
            {flatten(routes, 'subRoutes')
              .filter(route => route.path)
              .map(({ component: Component, layout: Layout, ...rest }) => {
                const renderHandler = (props: any) => {
                  if (Layout) {
                    return (
                      <Layout {...props} title={rest.title}>
                        <Component {...props} />
                      </Layout>
                    );
                  }
                  return (
                    <Default {...props} title={rest.title}>
                      <Component {...props} />
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
              })}
            <Route render={renderError(NotFound)} />
          </Switch>
        </BrowserRouter>
      </ThemeProvider>
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
