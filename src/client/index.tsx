import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Helmet } from 'react-helmet'

import { ONE } from '../shared/one'

ReactDOM.render(
    <p>
        <Helmet>
            <title>A title</title>
        </Helmet>
        This is blog {ONE}
    </p>,
    document.getElementById('app')
);
