import { combineReducers, createStore, Reducer, Store } from 'redux'

import { ClientInitialState } from './client-data'


export enum StatePart {
    Foo = 0
}


export enum OpState {
    Init = 0,
    Preloaded = 1,
    Loading = 2,
    Ready = 3,
    PartialUpdate = 4,
    Failed = 5
}


export interface FooInit {
    part: StatePart.Foo,
    type: OpState.Init;
}
export interface FooPreloaded {
    part: StatePart.Foo,
    type: OpState.Preloaded;
    text: string;
}
export interface FooLoading {
    part: StatePart.Foo,
    type: OpState.Loading;
}
export interface FooReady {
    part: StatePart.Foo;
    type: OpState.Ready;
    text: string;
}
export interface FooFailed {
    part: StatePart.Foo;
    type: OpState.Failed;
    errorMessage: string;
}

export type FooState = FooInit | FooPreloaded | FooLoading | FooReady | FooFailed;

const fooInitialState: FooState = {
    part: StatePart.Foo,
    type: OpState.Init
};

function foo(state = fooInitialState, action: FooState): FooState {
    if (action.part != StatePart.Foo) {
        return state;
    }

    switch (action.type) {
        case OpState.Preloaded:
        case OpState.Init:
        case OpState.Loading:
        case OpState.Ready:
        case OpState.Failed:
            return action;
        default:
            return state;
    }
}



export const reducers: Reducer<any> = combineReducers({
    foo: foo
});


export function createStoreFromInitialState(reducers: Reducer<any>, clientInitialState: ClientInitialState): Store<any> {
    const store = createStore(reducers);

    if (clientInitialState.text != null) {
        store.dispatch({
            part: StatePart.Foo,
            type: OpState.Preloaded,
            text: clientInitialState.text
        });
    }

    return store;
}
