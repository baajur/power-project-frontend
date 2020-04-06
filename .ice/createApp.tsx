import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as ReactDOMServer from 'react-dom/server';
import * as deepmerge from 'deepmerge'
import RuntimeModule from './runtimeModule'
import { IAppConfig } from './types'
import '../src/global.scss'

export interface IContext {
  initialData: any;
  pageInitialProps: any;
  pathname: string;
}

const defaultAppConfig = {
  app: {
    rootId: 'ice-container',
  },
  router: {
    type: 'hash',
  }
}

function createAppWithSSR(customConfig: IAppConfig, context: IContext) {
  const appConfig = deepmerge(defaultAppConfig, customConfig)
  appConfig.router.type = 'static'
  return renderApp(appConfig, context)
}

let appConfigData = {}
function createApp(customConfig: IAppConfig) {
  const appConfig = deepmerge(defaultAppConfig, customConfig)

  // pass appConfig to the server
  if (process.env.__IS_SERVER__) {
    appConfigData = appConfig
    return
  }

  // client side rendering
  let initialData = {}
  let pageInitialProps = {}

  // ssr enabled and the server has returned data
  if (window.__ICE_APP_DATA__) {
    initialData = window.__ICE_APP_DATA__
    pageInitialProps = window.__ICE_PAGE_PROPS__
    renderApp(appConfig, { initialData, pageInitialProps })
  } else {
    // ssr not enabled, or SSR is enabled but the server does not return data
    if (appConfig.app.getInitialData) {
      (async() => {
        initialData = await appConfig.app.getInitialData()
        renderApp(appConfig, { initialData, pageInitialProps })
      })()
    } else {
      renderApp(appConfig)
    }
  }
}

function renderApp(config: IAppConfig, context: IContext) {
  const runtime = new RuntimeModule(config, {}, context)
  
  runtime.loadModlues([require('E:/12-myFolder/53-power-project-frontend/node_modules/build-plugin-ice-core/lib/module.js'),require('E:/12-myFolder/53-power-project-frontend/node_modules/build-plugin-ice-router/lib/module.js'),require('E:/12-myFolder/53-power-project-frontend/node_modules/build-plugin-ice-logger/lib/module.js'),require('E:/12-myFolder/53-power-project-frontend/node_modules/build-plugin-ice-request/lib/module.js'),require('E:/12-myFolder/53-power-project-frontend/node_modules/build-plugin-ice-store/lib/module.js'),])
  

  const { appConfig, modifyDOMRender } = runtime
  const { rootId, mountNode } = appConfig.app
  const AppProvider = runtime.composeAppProvider();
  const AppRouter = runtime.getAppRouter();

  function App() {
    const appContent = (
      <AppRouter />
    );
    return AppProvider ? <AppProvider>{appContent}</AppProvider> : appContent;
  }

  if (process.env.__IS_SERVER__) {
    return ReactDOMServer.renderToString(<App />)
  } else {
    const appMountNode = mountNode || document.getElementById(rootId)
    if (modifyDOMRender) {
      return modifyDOMRender({ App, appMountNode })
    } else {
      return ReactDOM[process.env.__SSR_ENABLED__ ? 'hydrate' : 'render'](<App />, appMountNode)
    }
  }
}

function getAppConfig() {
  return appConfigData
}

export { createApp, getAppConfig, createAppWithSSR }
