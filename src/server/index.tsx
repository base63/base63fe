import * as compression from 'compression'
import { createNamespace } from 'continuation-local-storage'
import * as express from 'express'
import * as HttpStatus from 'http-status-codes'
import * as Mustache from 'mustache'
import { MarshalFrom } from 'raynor'
import * as React from 'react'
import * as ReactDOMServer from 'react-dom/server'
import { Helmet } from 'react-helmet'
import * as webpack from 'webpack'
import * as theWebpackDevMiddleware from 'webpack-dev-middleware'
import * as serializeJavascript from 'serialize-javascript'

import { isLocal } from '@base63/common-js'
import { RequestWithIdentity, Session, SessionState } from '@base63/identity-sdk-js'
import {
    newCommonServerMiddleware,
    newLocalCommonServerMiddleware,
    newNamespaceMiddleware,
    Request
} from '@base63/common-server-js'

import { CompiledBundles, Bundles, WebpackDevBundles } from './bundles'
import * as config from '../shared/config'
import { ClientConfig, ClientInitialState } from '../shared/client-data'
import { inferLanguage } from '../shared/utils'


async function main() {
    const webpackConfig = require('../../webpack.config.js');
    const clientConfigMarshaller = new (MarshalFrom(ClientConfig))();
    const clientInitialStateMarshaller = new (MarshalFrom(ClientInitialState))();

    const bundles: Bundles = isLocal(config.ENV)
        ? new WebpackDevBundles(theWebpackDevMiddleware(webpack(webpackConfig), {
            //Different because we're mounting on /real/client to boot webpackConfig.output.publicPath,
            publicPath: '/',
            serverSideRender: false
        }))
        : new CompiledBundles();

    const namespace = createNamespace(config.CLS_NAMESPACE_NAME);

    const app = express();

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

    function serverSideRender(session: Session, initialState: ClientInitialState/*, ssrRouterState: RouterState*/): string {
        const language = inferLanguage(session);

        const clientConfig = {
            env: config.ENV,
            origin: config.ORIGIN,
            context: config.CONTEXT,
            rollbarClientToken: config.ROLLBAR_CLIENT_TOKEN,
            session: session,
            language: language
        };

        namespace.set('SESSION', session);
        namespace.set('LANG', language);

        const appHtml = ReactDOMServer.renderToString(
            <p>
                <Helmet>
                    <title>A title</title>
                </Helmet>
                This is blog {initialState.text}
            </p>
        );

        const helmetData = Helmet.renderStatic();

        return Mustache.render(bundles.getHtmlIndexTemplate(), {
            PAGE_TITLE_HTML: helmetData.title,
            PAGE_META_HTML: helmetData.meta,
            PAGE_LINK_HTML: helmetData.link,
            APP_HTML: appHtml,
            CLIENT_CONFIG: serializeJavascript(clientConfigMarshaller.pack(clientConfig), { isJSON: true }),
            CLIENT_INITIAL_STATE: serializeJavascript(clientInitialStateMarshaller.pack(initialState), { isJSON: true }),
            WEBPACK_MANIFEST_JS: bundles.getManifestJs(),
        });
    }

    // Install auth-flow stuff
    app.use('/real/client', bundles.getOtherBundlesRouter());
    // Install api-gateway stuff

    const siteInfoRouter = express.Router();

    siteInfoRouter.get('/robots.txt', (_req: Request, res: express.Response) => {
        res.type('.txt');
        res.write(Mustache.render(bundles.getRobotsTxt(), { HOME_URI: config.ORIGIN }));
        res.status(HttpStatus.OK);
        res.end();
    });

    siteInfoRouter.get('/humans.txt', (_req: Request, res: express.Response) => {
        res.type('.txt');
        res.write(bundles.getHumansTxt());
        res.status(HttpStatus.OK);
        res.end();
    });

    siteInfoRouter.get('/sitemap.xml', (_req: Request, res: express.Response) => {
        res.type('application/xml; charset=utf-8');
        res.write(Mustache.render(bundles.getSitemapXml(), {
            HOME_URI: config.ORIGIN,
            HOME_LAST_MOD: new Date().toISOString()
        }));
        res.status(HttpStatus.OK);
        res.end();
    });

    const appRouter = express.Router();

    appRouter.get('/', (_req: RequestWithIdentity, res: express.Response) => {
        const initialState: ClientInitialState = {
            text: 'hello world'
        };

        const theSession = new Session();
        theSession.state = SessionState.Active;
        theSession.xsrfToken = ('0' as any).repeat(64);
        theSession.agreedToCookiePolicy = false;
        theSession.timeCreated = new Date(Date.now());
        theSession.timeLastUpdated = theSession.timeCreated;

        res.type('html');
        res.write(serverSideRender(
            theSession, // TODO: use req.session here
            initialState
            /* req.ssrRouterState */
        ));
        res.status(HttpStatus.OK);
        res.end();
    });

    app.use('/', siteInfoRouter);
    app.use('/', appRouter);

    app.listen(config.PORT, config.ADDRESS, () => {
        console.log(`Started ${config.NAME} ... ${config.ADDRESS}:${config.PORT}`);
    });
}

main();
