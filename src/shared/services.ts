import * as Rollbar from 'rollbar'

export let ROLLBAR_CLIENT: () => Rollbar;
export let setServices: (rollbar: Rollbar) => void;

let rollbarClient: Rollbar | null = null;

ROLLBAR_CLIENT = () => {
    if (rollbarClient == null) {
        throw new Error('Rollbar client not provided');
    }

    return rollbarClient;
};

setServices = (newRollbarClient: Rollbar) => {
    rollbarClient = newRollbarClient;
};
