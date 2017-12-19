import { getNamespace } from 'continuation-local-storage'
import { config } from 'dotenv'

import { Env, parseEnv, isOnServer } from '@base63/common-js'
import { getFromEnv } from '@base63/common-server-js'
import { Auth0Config, PathMatch } from '@base63/identity-sdk-js'


config();


export const CLS_NAMESPACE_NAME: string = 'base63.request';
export const NAME: string = 'base63fe';
export const ALLOWED_PATHS: PathMatch[] = [{
    path: '/',
    mode: 'full'
}, {
    path: '/admin',
    mode: 'full'
}];

export const ENV: Env = parseEnv(getFromEnv('ENV'));
export const ADDRESS: string = getFromEnv('ADDRESS');
export const PORT: number = parseInt(getFromEnv('PORT'), 10);
export const ORIGIN: string = getFromEnv('ORIGIN');
export const IDENTITY_SERVICE_HOST: string = getFromEnv('IDENTITY_SERVICE_HOST');
export const AUTH0_CONFIG: Auth0Config = {
    clientId: getFromEnv('AUTH0_CLIENT_ID'),
    clientSecret: getFromEnv('AUTH0_CLIENT_SECRET'),
    domain: getFromEnv('AUTH0_DOMAIN'),
    loginCallbackUri: getFromEnv('AUTH0_LOGIN_CALLBACK_URI')
};
export const LOGGLY_TOKEN: string | null = isOnServer(ENV) ? getFromEnv('LOGGLY_TOKEN') : null;
export const LOGGLY_SUBDOMAIN: string | null = isOnServer(ENV) ? getFromEnv('LOGGLY_SUBDOMAIN') : null;
export const ROLLBAR_SERVER_TOKEN: string | null = isOnServer(ENV) ? getFromEnv('ROLLBAR_SERVER_TOKEN') : null;
export const ROLLBAR_CLIENT_TOKEN: string | null = isOnServer(ENV) ? getFromEnv('ROLLBAR_CLIENT_TOKEN') : null;
export const SESSION = () => {
    const namespace = getNamespace(CLS_NAMESPACE_NAME);
    const session = namespace.get('SESSION');
    return session;
};
export const LANG = () => {
    const namespace = getNamespace(CLS_NAMESPACE_NAME);
    const lang = namespace.get('LANG');
    return lang;
};
