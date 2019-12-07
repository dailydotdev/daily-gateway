import uuid4 from 'uuid/v4';
import config from './config';

export const setTrackingId = (ctx, id) => {
  ctx.trackingId = id;
  if (id) {
    ctx.cookies.set(config.cookies.tracking.key, id, config.cookies.tracking.opts);
  } else {
    ctx.cookies.set(config.cookies.tracking.key);
  }
};

export const getTrackingId = (ctx) => {
  if (!ctx.trackingId || !ctx.trackingId.length) {
    ctx.trackingId = ctx.cookies.get(config.cookies.tracking.key, config.cookies.tracking.opts);
  }

  return ctx.trackingId;
};

export default function (ctx, next) {
  if (!ctx.userAgent.isBot && !ctx.state.service) {
    let userId = getTrackingId(ctx);
    if (ctx.state.user) {
      // eslint-disable-next-line prefer-destructuring
      userId = ctx.state.user.userId;
    } else if (!userId || !userId.length) {
      userId = uuid4().replace(/-/g, '');
    }

    if (userId !== getTrackingId(ctx)) {
      setTrackingId(ctx, userId);
    }
    ctx.request.headers['user-id'] = userId;
  }
  return next();
}
