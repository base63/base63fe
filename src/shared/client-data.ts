import {
    MarshalEnum,
    MarshalFrom,
    MarshalWith,
    OptionalOf
} from 'raynor'
import * as r from 'raynor'

import { Env, LanguageMarshaller } from '@base63/common-js'
import { Session } from '@base63/identity-sdk-js'


export class ClientConfig {
    @MarshalWith(MarshalEnum(Env))
    env: Env;

    @MarshalWith(r.WebUriMarshaller)
    origin: string;

    @MarshalWith(OptionalOf(r.StringMarshaller))
    rollbarClientToken: string | null;

    @MarshalWith(LanguageMarshaller)
    language: string;

    @MarshalWith(MarshalFrom(Session))
    session: Session;
}


export class ClientInitialState {
    @MarshalWith(r.StringMarshaller)
    text: string
}
