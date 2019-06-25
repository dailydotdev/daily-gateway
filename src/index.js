import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import KoaPinoLogger from 'koa-pino-logger';
import Router from 'koa-router';
import userAgent from 'koa-useragent';
import etag from 'koa-etag';
import cors from '@koa/cors';
import proxy from 'koa-proxies';


import config from './config';
import errorHandler from './middlewares/errorHandler';
import logger from './logger';
import { verify as verifyJwt } from './jwt';
import verifyTracking from './tracking';

import health from './routes/health';
import download from './routes/download';
import users from './routes/users';
import auth from './routes/auth';

const app = new Koa();

app.keys = [config.cookies.secret];

app.proxy = config.env === 'production';

// TODO: disabled due to performance issues
// app.use(compress());

const allowedOrigins = config.cors.origin.split(',');

app.use(cors({
  credentials: true,
  origin(ctx) {
    const requestOrigin = ctx.get('Origin');
    if (allowedOrigins.filter(origin => requestOrigin.indexOf(origin) > -1).length) {
      return requestOrigin;
    }
    return false;
  },
}));
app.use(KoaPinoLogger({ logger, useLevel: 'debug' }));
app.use(errorHandler());
app.use(verifyJwt);
app.use(userAgent);

// Machine-to-machine authentication
app.use((ctx, next) => {
  if (ctx.request.get('authorization') === `Service ${config.accessSecret}`
    && ctx.request.get('user-id') && ctx.request.get('logged-in')) {
    // eslint-disable-next-line
    ctx.state = {
      user: {
        userId: ctx.request.get('user-id'),
      },
      service: true,
    };
  } else {
    delete ctx.request.headers['user-id'];
    delete ctx.request.headers['logged-in'];
  }
  return next();
});

app.use(verifyTracking);

// Forward authentication headers
app.use((ctx, next) => {
  if (ctx.state.user && ctx.state.user.userId) {
    ctx.request.headers['logged-in'] = true;
    ctx.request.headers['user-id'] = ctx.state.user.userId;
  }
  return next();
});

const router = new Router({
  prefix: '/v1',
});

router.use(etag());
router.use(bodyParser());
router.use(users.routes(), users.allowedMethods());
router.use(auth.routes(), auth.allowedMethods());

app.use(router.routes(), router.allowedMethods());
app.use(download.routes(), download.allowedMethods());
app.use(health.routes(), health.allowedMethods());

app.use(proxy('/r', {
  target: config.redirectorUrl,
  changeOrigin: true,
  xfwd: true,
}));

app.use(proxy('/v1/a', {
  target: config.monetizationUrl,
  changeOrigin: true,
  xfwd: true,
  rewrite: path => path.substr('/v1'.length),
}));

app.use(proxy('/icon', {
  target: config.besticonUrl,
  changeOrigin: true,
  xfwd: true,
}));
app.use(proxy('/lettericons', {
  target: config.besticonUrl,
  changeOrigin: true,
  xfwd: true,
}));

app.use(proxy('/', {
  target: config.apiUrl,
  changeOrigin: true,
  xfwd: true,
  headers: {
    authorization: `Service ${config.apiSecret}`,
  },
}));

export default app;
