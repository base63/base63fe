import { MarshalFrom } from 'raynor'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Helmet } from 'react-helmet'
import * as Rollbar from 'rollbar'

import { isOnServer, envToString } from '@base63/common-js'

import * as config from './config'
import { ClientInitialState } from '../shared/client-data'


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

config.setServices(rollbar);

const clientInitialState = clientInitialStateMarshaller.extract((window as any).__BASE63_CLIENT_INITIAL_STATE);
delete (window as any).__BASE63_INITIAL_STATE;

const initialState = {} as any;

if (clientInitialState.text != null) {
    initialState.text = clientInitialState.text;
}


ReactDOM.render(
    <p>
        <Helmet>
            <title>A title</title>
        </Helmet>
        This is blog {initialState.text}
    </p>,
    document.getElementById('app')
);
