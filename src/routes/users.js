import Router from 'koa-router';
import validator, {
  object,
  string,
} from 'koa-context-validator';
import { ForbiddenError, ValidationError } from '../errors';
import provider from '../models/provider';
import userModel from '../models/user';
import role from '../models/role';
import visit from '../models/visit';
import { getTrackingId, setTrackingId } from '../tracking';
import config from '../config';
import { addSubdomainOpts } from '../cookies';
import { updateUserContact } from '../mailing';

const router = Router({
  prefix: '/users',
});

router.get(
  '/me',
  async (ctx) => {
    let visitId;
    const trackingId = getTrackingId(ctx);
    if (ctx.state.user) {
      const { userId } = ctx.state.user;
      visitId = userId;

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
    } else if (trackingId && trackingId.length) {
      visitId = trackingId;
      ctx.status = 200;
      ctx.body = { id: trackingId };
    } else {
      throw new ForbiddenError();
    }

    const app = ctx.request.get('app');
    if (app === 'extension') {
      visit.upsert(visitId, app, new Date())
        .catch(err => ctx.log.error({ err }, `failed to update visit for ${visitId}`));
    }
  },
);

router.put(
  '/me',
  validator({
    body: object().keys({
      name: string().required(),
      email: string().email().required(),
      company: string(),
      title: string(),
    }),
  }, { stripUnknown: true }),
  async (ctx) => {
    if (ctx.state.user) {
      const { userId } = ctx.state.user;
      const user = await userModel.getById(userId);
      if (!user) {
        throw new ForbiddenError();
      }
      const { body } = ctx.request;
      const newProfile = Object.assign({}, user, body, { infoConfirmed: true });
      const dup = await userModel.checkDuplicateEmail(userId, newProfile.email);
      if (dup) {
        throw new ValidationError('email', 'email already exists');
      }
      ctx.log.info(`updating profile for ${userId}`);
      await userModel.update(userId, newProfile);
      updateUserContact(newProfile, user.email)
        .catch((err) => {
          ctx.log.warn({ err }, `failed to update ${userId} to contact`);
        });
      ctx.body = newProfile;
      ctx.status = 200;
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
