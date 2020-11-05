import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import KoaPinoLogger from 'koa-pino-logger';

import Router from 'koa-router';
import errorHandler from './middlewares/errorHandler';
import logger from './logger';

import health from './routes/health';
import workers from './workers';
import { CustomError } from './errors';

const app = new Koa();

app.proxy = true;

app.use(KoaPinoLogger({ logger, useLevel: 'debug' }));
app.use(errorHandler());

app.use(health.routes(), health.allowedMethods());

const router = new Router();
router.use(bodyParser());

workers.forEach((worker) => {
  router.post(`/${worker.subscription}`, async (ctx) => {
    const { body } = ctx.request;
    if (!body) {
      throw new CustomError('no Pub/Sub message received', 400);
    }
    if (!body.message) {
      throw new CustomError('invalid Pub/Sub message format', 400);
    }

    await worker.handler(body.message, ctx.log);
    ctx.status = 204;
  });
});

app.use(router.routes(), router.allowedMethods());

export default app;
