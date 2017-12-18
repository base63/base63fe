import { MarshalFrom } from 'raynor'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import * as Rollbar from 'rollbar'

import { isOnServer, envToString } from '@base63/common-js'

import * as config from './config'
import { App } from '../shared/app'
import { ClientInitialState } from '../shared/client-data'
import * as services from '../shared/services'
import { createStoreFromInitialState, reducers } from '../shared/store'

const clientInitialStateMarshaller = new (MarshalFrom(ClientInitialState))();


const rollbar = new Rollbar({
    accessToken: isOnServer(config.ENV) ? (config.ROLLBAR_CLIENT_TOKEN as string) : 'FAKE_TOKEN_WONT_BE_USED_IN_LOCAL_OR_TEST',
    logLevel: 'warning',
    reportLevel: 'warning',
    captureUncaught: true,
    captureUnhandledRejections: true,
    enabled: isOnServer(config.ENV),
    payload: {
        // TODO: fill in the person field!
        serviceName: config.NAME,
        environment: envToString(config.ENV)
    }
});

services.setServices(rollbar);

const clientInitialState = clientInitialStateMarshaller.extract((window as any).__BASE63_CLIENT_INITIAL_STATE);
delete (window as any).__BASE63_INITIAL_STATE;

const store = createStoreFromInitialState(reducers, clientInitialState);

ReactDOM.render(
    <Provider store={store}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </Provider>,
    document.getElementById('app')
);
