import * as compression from 'compression'
import { createNamespace } from 'continuation-local-storage'
import * as express from 'express'
import * as HttpStatus from 'http-status-codes'
import * as Mustache from 'mustache'
import { MarshalFrom } from 'raynor'
import * as React from 'react'
import * as ReactDOMServer from 'react-dom/server'
import { Helmet } from 'react-helmet'
import { Provider } from 'react-redux'
import { StaticRouter } from 'react-router-dom'
import * as webpack from 'webpack'
import * as theWebpackDevMiddleware from 'webpack-dev-middleware'
import * as serializeJavascript from 'serialize-javascript'

import { isLocal } from '@base63/common-js'
import {
    IdentityClient,
    newIdentityClient,
    RequestWithIdentity,
    Session
} from '@base63/identity-sdk-js'
import {
    newAuth0AuthFlowRouter,
    newApiGatewayRouter,
    newSessionMiddleware,
    SessionLevel,
    SessionInfoSource
} from '@base63/identity-sdk-js/server'
import {
    InternalWebFetcher,
    newCommonServerMiddleware,
    newLocalCommonServerMiddleware,
    newNamespaceMiddleware,
    Request,
    WebFetcher
} from '@base63/common-server-js'

import { CompiledBundles, Bundles, WebpackDevBundles } from './bundles'
import { App } from '../shared/app'
import * as config from '../shared/config'
import { ClientConfig, ClientInitialState } from '../shared/client-data'
import { createStoreFromInitialState, reducers } from '../shared/store'
import { inferLanguage } from '../shared/utils'


async function main() {
    // Global setup, but hidden inside main()
    // ********************

    const webpackConfig = require('../../webpack.config.js');

    const clientConfigMarshaller = new (MarshalFrom(ClientConfig))();
    const clientInitialStateMarshaller = new (MarshalFrom(ClientInitialState))();

    const internalWebFetcher: WebFetcher = new InternalWebFetcher();
    const identityClient: IdentityClient = newIdentityClient(config.ENV, config.ORIGIN, config.IDENTITY_SERVICE_HOST, internalWebFetcher);

    const bundles: Bundles = isLocal(config.ENV)
        ? new WebpackDevBundles(theWebpackDevMiddleware(webpack(webpackConfig), {
            //Different because we're mounting on /real/client to boot webpackConfig.output.publicPath,
            publicPath: '/',
            serverSideRender: false
        }))
        : new CompiledBundles();

    const namespace = createNamespace(config.CLS_NAMESPACE_NAME);

    function serverSideRender(url: string, session: Session, clientInitialState: ClientInitialState): [string, number | null] {
        const language = inferLanguage(session);
        const store = createStoreFromInitialState(reducers, clientInitialState);

        const clientConfig = {
            env: config.ENV,
            origin: config.ORIGIN,
            rollbarClientToken: config.ROLLBAR_CLIENT_TOKEN,
            session: session,
            language: language
        };

        namespace.set('SESSION', session);
        namespace.set('LANG', language);

        const staticContext: any = {};
        const appHtml = ReactDOMServer.renderToString(
            <Provider store={store}>
                <StaticRouter location={url} context={staticContext}>
                    <App />
                </StaticRouter>
            </Provider>
        );

        const specialStatus = staticContext.status == HttpStatus.NOT_FOUND ? HttpStatus.NOT_FOUND : null;

        const helmetData = Helmet.renderStatic();

        return [Mustache.render(bundles.getHtmlIndexTemplate(), {
            PAGE_TITLE_HTML: helmetData.title,
            PAGE_META_HTML: helmetData.meta,
            PAGE_LINK_HTML: helmetData.link,
            APP_HTML: appHtml,
            CLIENT_CONFIG: serializeJavascript(clientConfigMarshaller.pack(clientConfig), { isJSON: true }),
            CLIENT_INITIAL_STATE: serializeJavascript(clientInitialStateMarshaller.pack(clientInitialState), { isJSON: true }),
            WEBPACK_MANIFEST_JS: bundles.getManifestJs(),
        }), specialStatus];
    }

    const app = express();

    // Setup global properties and behaviours of the application
    // ********************

    app.disable('x-powered-by');
    app.use(newNamespaceMiddleware(namespace))
    if (isLocal(config.ENV)) {
        app.use(newLocalCommonServerMiddleware(config.NAME, config.ENV, false));
    } else {
        app.use(newCommonServerMiddleware(
            config.NAME,
            config.ENV,
            config.LOGGLY_TOKEN as string,
            config.LOGGLY_SUBDOMAIN as string,
            config.ROLLBAR_SERVER_TOKEN as string));
    }
    app.use(compression({ threshold: 0 }));

    // Setup the /real portion of the path-space. Here are things which don't belong to the client-side
    // interaction, but rather to the server-side one, callbacks from other services etc.
    // ********************

    // Setup the auth0 authentication flow. Has a complex dance wrt sessions.
    app.use('/real/auth0-auth-flow', newAuth0AuthFlowRouter(
        config.ENV, config.ALLOWED_PATHS, config.AUTH0_CONFIG, internalWebFetcher, identityClient));

    // An API gateway for the client side code. Needs session to exist in the request.
    app.use('/real/api-gateway', newApiGatewayRouter(internalWebFetcher));

    // Static serving of the client side code assets (index.html, vendor.js etc). No session. Derived
    // from the bundles.
    app.use('/real/client', bundles.getOtherBundlesRouter());

    // Setup serving of a bunch of files for interacting with the web at large, such as robots.txt,
    // sitemaps etc. These are derived from the bundles, with some extra data baked in. No session.
    // ********************

    const siteInfoRouter = express.Router();

    siteInfoRouter.get('/robots.txt', (_req: Request, res: express.Response) => {
        res.status(HttpStatus.OK);
        res.type('.txt');
        res.write(Mustache.render(bundles.getRobotsTxt(), { HOME_URI: config.ORIGIN }));
        res.end();
    });

    siteInfoRouter.get('/humans.txt', (_req: Request, res: express.Response) => {
        res.status(HttpStatus.OK);
        res.type('.txt');
        res.write(bundles.getHumansTxt());
        res.end();
    });

    siteInfoRouter.get('/sitemap.xml', (_req: Request, res: express.Response) => {
        res.status(HttpStatus.OK);
        res.type('application/xml; charset=utf-8');
        res.write(Mustache.render(bundles.getSitemapXml(), {
            HOME_URI: config.ORIGIN,
            HOME_LAST_MOD: new Date().toISOString()
        }));
        res.end();
    });

    app.use('/', siteInfoRouter);

    // Setup serving for all all client application level routes. Any path a user enters, which
    // doesn't match the ones from above (so /real ones or standard web ones) will be handled
    // by serving the "client application". This translated to doing a server-side render of the
    // application and serving that embedded into {@link src/shared/static/index.html}, which
    // will reference /real/client/client.js and other static resources in order to boot it up.
    // ********************

    const appRouter = express.Router();

    appRouter.use(newSessionMiddleware(SessionLevel.None, SessionInfoSource.Cookie, config.ENV, identityClient));
    appRouter.get('*', (req: RequestWithIdentity, res: express.Response) => {
        const initialState: ClientInitialState = {
            text: 'hello world'
        };

        const [content, specialStatus] = serverSideRender(
            req.url,
            req.session, // TODO: use req.session here
            initialState
        );

        res.status(specialStatus != null ? specialStatus : HttpStatus.OK);
        res.type('html');
        res.write(content);
        res.end();
    });

    app.use('/', appRouter);

    // Start serving
    // ********************

    app.listen(config.PORT, config.ADDRESS, () => {
        console.log(`Started ${config.NAME} ... ${config.ADDRESS}:${config.PORT}`);
    });
}


main();
