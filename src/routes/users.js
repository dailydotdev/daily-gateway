import Router from 'koa-router';
import { ForbiddenError } from '../errors';
import provider from '../models/provider';
import userModel from '../models/user';
import role from '../models/role';
import visit from '../models/visit';
import { getTrackingId, setTrackingId } from '../tracking';
import config from '../config';
import { addSubdomainOpts } from '../cookies';

const router = Router({
  prefix: '/users',
});

router.get(
  '/me',
  async (ctx) => {
    const trackingId = getTrackingId(ctx);
    if (ctx.state.user) {
      const { userId } = ctx.state.user;

      const [user, userProvider] = await Promise.all([
        userModel.getById(userId),
        provider.getByUserId(userId),
      ]);
      if (!user) {
        setTrackingId(ctx, null);
        throw new ForbiddenError();
      }

      // Refresh the auth cookie
      const auth = ctx.cookies.get(config.cookies.auth.key);
      if (auth) {
        ctx.cookies.set(
          config.cookies.auth.key, auth,
          addSubdomainOpts(ctx, config.cookies.auth.opts),
        );
      }

      ctx.status = 200;
      ctx.body = Object.assign({}, user, { providers: [userProvider.provider] });
      const app = ctx.request.get('app');
      if (app === 'extension') {
        visit.upsert(userId, app, new Date())
          .catch(err => ctx.log.error({ err }, `failed to update visit for ${userId}`));
      }
    } else if (trackingId && trackingId.length) {
      ctx.status = 200;
      ctx.body = { id: trackingId };
    } else {
      throw new ForbiddenError();
    }
  },
);

router.get(
  '/me/info',
  async (ctx) => {
    if (ctx.state.user) {
      const { userId } = ctx.state.user;
      const user = await userModel.getById(userId);
      if (!user) {
        throw new ForbiddenError();
      }
      ctx.body = { name: user.name, email: user.email };
      ctx.status = 200;
    } else {
      throw new ForbiddenError();
    }
  },
);

router.get(
  '/me/roles',
  async (ctx) => {
    if (ctx.state.user) {
      const { userId } = ctx.state.user;
      ctx.body = await role.getByUserId(userId);
      ctx.status = 200;
    } else {
      throw new ForbiddenError();
    }
  },
);

router.post(
  '/logout',
  async (ctx) => {
    setTrackingId(ctx, null);
    ctx.cookies.set(config.cookies.auth.key);
    ctx.status = 204;
  },
);

export default router;
