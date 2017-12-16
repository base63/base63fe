import { getNamespace } from 'continuation-local-storage'
import { config } from 'dotenv'
import * as Rollbar from 'rollbar'

import { Context, Env, parseContext, parseEnv, isOnServer } from '@base63/common-js'
import { getFromEnv } from '@base63/common-server-js'
import { Session } from '@base63/identity-sdk-js'


config();


export const CLS_NAMESPACE_NAME: string = 'neoncity.request';
export const NAME: string = 'base63fe';
export const ENV: Env = parseEnv(getFromEnv('ENV'));
export const CONTEXT: Context = parseContext(getFromEnv('CONTEXT'));
export const ADDRESS: string = getFromEnv('ADDRESS');
export const PORT: number = parseInt(getFromEnv('PORT'), 10);
export const ORIGIN: string = getFromEnv('ORIGIN');
export let LOGGLY_TOKEN: string | null;
export let LOGGLY_SUBDOMAIN: string | null;
export let ROLLBAR_SERVER_TOKEN: string | null;
export let ROLLBAR_CLIENT_TOKEN: string | null;
export let SESSION: () => Session;
export let LANG: () => string;
export let ROLLBAR_CLIENT: () => Rollbar;
export let setServices: (rollbar: Rollbar) => void;

SESSION = () => {
    const namespace = getNamespace(CLS_NAMESPACE_NAME);
    const session = namespace.get('SESSION');
    return session;
};

LANG = () => {
    const namespace = getNamespace(CLS_NAMESPACE_NAME);
    const lang = namespace.get('LANG');
    return lang;
};

ROLLBAR_CLIENT = () => {
    throw new Error('Should not be invoked');
}


setServices = (_rollbarClient: Rollbar) => {
    throw new Error('Should not be invoked');
};

if (isOnServer(ENV)) {
    LOGGLY_TOKEN = getFromEnv('LOGGLY_TOKEN');
    LOGGLY_SUBDOMAIN = getFromEnv('LOGGLY_SUBDOMAIN');
    ROLLBAR_SERVER_TOKEN = getFromEnv('ROLLBAR_SERVER_TOKEN');
    ROLLBAR_CLIENT_TOKEN = getFromEnv('ROLLBAR_CLIENT_TOKEN');
} else {
    LOGGLY_TOKEN = null;
    LOGGLY_SUBDOMAIN = null;
    ROLLBAR_SERVER_TOKEN = null;
    ROLLBAR_CLIENT_TOKEN = null;
}
