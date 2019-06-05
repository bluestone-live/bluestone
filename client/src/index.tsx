import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as stores from './stores';
import * as OfflinePluginRuntime from 'offline-plugin/runtime';
import { Switch, Route, Redirect, BrowserRouter } from 'react-router-dom';
import { Provider as MobxProvider } from 'mobx-react';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from 'styled-components';
import i18n from './i18n';
import flatten from './utils/flatten';
import routes from './routes';
import { Default } from './layouts';
import NotFound from './components/common/NotFount';
import defaultTheme from './styles/themes/default';
import 'normalize.css';

const renderError = (ErrorComponent: React.ComponentType) => (props: any) => (
  <Default {...props}>
    <ErrorComponent />
  </Default>
);

const App = () => (
  <I18nextProvider i18n={i18n}>
    <MobxProvider {...stores}>
      <ThemeProvider theme={defaultTheme}>
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
    </MobxProvider>
  </I18nextProvider>
);

const mount = async () => {
  // load basic data
  await stores.initStore();

  ReactDOM.render(<App />, document.getElementById('app'));
};

mount();

if (process.env.NODE_ENV !== 'production') {
  if ((module as any).hot) {
    (module as any).hot.accept();
  }
} else {
  OfflinePluginRuntime.install();
}
