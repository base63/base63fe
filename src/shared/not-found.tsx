import * as React from 'react'
import { Route } from 'react-router-dom'
import * as HttpStatus from 'http-status-codes'

export const NotFound = () => {
    return (
        <Route render={({ staticContext }) => {
            if (staticContext) {
                staticContext.status = HttpStatus.NOT_FOUND;
            }

            return (
                <div>
                    <h1>404 : Not Found</h1>
                </div>
            )
        }} />
    );
};
