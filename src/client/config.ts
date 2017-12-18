import { MarshalFrom } from 'raynor'

import { Context, Env } from '@base63/common-js'
import { Session } from '@base63/identity-sdk-js'

import { ClientConfig } from '../shared/client-data'


export const CLS_NAMESPACE_NAME: string = 'base63.request';

export const NAME: string = 'base63fe';
export let ENV: Env;
export let CONTEXT: Context;
export let ADDRESS: string;
export let PORT: number;
export let ORIGIN: string;
export let ROLLBAR_CLIENT_TOKEN: string | null;
export let SESSION: () => Session;
export let LANG: () => string;


const clientConfigMarshaller = new (MarshalFrom(ClientConfig))();

const clientConfig = clientConfigMarshaller.extract((window as any).__BASE63_CLIENT_CONFIG);
delete (window as any).__BASE63_CLIENT_CONFIG;

ENV = clientConfig.env;
ORIGIN = clientConfig.origin;
CONTEXT = clientConfig.context;
ROLLBAR_CLIENT_TOKEN = clientConfig.rollbarClientToken;
SESSION = () => clientConfig.session;
LANG = () => clientConfig.language;
