import config from './config';
import { sign as signJwt } from './jwt';

export const addSubdomainOpts = (ctx, opts) => {
  const host = ctx.request.hostname;
  const parts = host.split('.');
  while (parts.length > 2) {
    parts.shift();
  }
  const domain = parts.join('.');
  return { ...opts, domain };
};

export const setAuthCookie = async (ctx, user, roles = []) => {
  const accessToken = await signJwt({ userId: user.id, premium: user.premium, roles }, null);
  ctx.cookies.set(
    config.cookies.auth.key, accessToken.token,
    addSubdomainOpts(ctx, config.cookies.auth.opts),
  );
};
