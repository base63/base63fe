import { config } from 'dotenv'

import { Context, Env, parseContext, parseEnv, isOnServer } from '@base63/common-js'
import { getFromEnv } from '@base63/common-server-js'

config();

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
