import config from './config';
import { sign as signJwt } from './jwt';

export const addSubdomainOpts = (ctx, opts) => {
  const host = ctx.request.hostname;
  const parts = host.split('.');
  while (parts.length > 2) {
    parts.shift();
  }
  const domain = parts.join('.');
  return Object.assign({}, opts, { domain });
};

export const setAuthCookie = async (ctx, user) => {
  const accessToken = await signJwt({ userId: user.id, premium: user.premium }, null);
  ctx.cookies.set(
    config.cookies.auth.key, accessToken.token,
    addSubdomainOpts(ctx, config.cookies.auth.opts),
  );
};
