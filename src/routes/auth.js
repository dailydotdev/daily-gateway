import Router from 'koa-router';
import rp from 'request-promise-native';
import validator, { object, string } from 'koa-context-validator';
import config from '../config';
import provider from '../models/provider';
import refreshToken from '../models/refreshToken';
import userModel from '../models/user';
import { fetchProfile } from '../profile';
import { sign as signJwt, verify as verifyJwt } from '../jwt';
import { notifyNewUser } from '../slack';
import { getTrackingId, setTrackingId } from '../tracking';
import { ForbiddenError } from '../errors';
import { generateChallenge } from '../auth';
import { addUserToContacts } from '../mailing';
import { setAuthCookie } from '../cookies';

const router = Router({
  prefix: '/auth',
});

const providersConfig = {
  github: config.github,
  google: config.google,
};

const allowedOrigins = config.cors.origin.split(',');

const validateRedirectUri = (redirectUri) => {
  if (!allowedOrigins.filter(origin => redirectUri.indexOf(origin) > -1).length) {
    throw new ForbiddenError();
  }
};

const authorize = (ctx, providerName, redirectUri) => {
  const { query } = ctx.request;

  validateRedirectUri(query.redirect_uri);
  const providerConfig = providersConfig[providerName];
  const url = `${providerConfig.authorizeUrl}?access_type=offline&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${providerConfig.clientId}&scope=${encodeURIComponent(providerConfig.scope)}&state=${encodeURIComponent(JSON.stringify(query))}`;

  ctx.status = 307;
  ctx.redirect(url);
};

const callback = async (ctx, providerName, payloadFunc) => {
  const { query } = ctx.request;
  const state = JSON.parse(query.state);
  validateRedirectUri(state.redirect_uri);
  const { token: code } = await signJwt(payloadFunc(query, state), 60 * 1000);

  ctx.status = 307;
  ctx.redirect(`${state.redirect_uri}${state.redirect_uri.indexOf('?') > -1 ? '&' : '?'}code=${code}`);
};

const authenticate = async (ctx, redirectUriFunc) => {
  const { body } = ctx.request;
  let codeJwt;
  try {
    codeJwt = await verifyJwt(body.code);
  } catch (err) {
    throw new ForbiddenError();
  }
  if (codeJwt.codeChallenge) {
    const challenge = generateChallenge(body.code_verifier);
    if (challenge !== codeJwt.codeChallenge) {
      ctx.log.info(`user code challenge ${codeJwt.codeChallenge} does not equal calculated challenge ${challenge}`);
      throw new ForbiddenError();
    }
  }
  const providerName = codeJwt.provider;
  const providerConfig = providersConfig[providerName];
  const redirectUri = redirectUriFunc(providerName, codeJwt);
  const resRaw = await rp({
    url: providerConfig.authenticateUrl,
    method: 'POST',
    headers: {
      accept: 'application/json',
    },
    form: {
      client_id: providerConfig.clientId,
      client_secret: providerConfig.clientSecret,
      code: codeJwt.providerCode,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    },
  });

  const res = (typeof resRaw === 'string') ? JSON.parse(resRaw) : resRaw;
  if (!res.access_token) {
    throw new ForbiddenError();
  }

  const profile = await fetchProfile(providerName, res.access_token);
  const userProvider = await provider.getByProviderId(profile.id, providerName);

  let newUser = true;
  let user;
  if (userProvider) {
    setTrackingId(ctx, userProvider.userId);
    newUser = false;
    [user] = await Promise.all([
      userModel.getById(userProvider.userId),
      provider.updateToken(userProvider.userId, providerName, res.access_token),
    ]);
  } else {
    const userId = getTrackingId(ctx);
    const hasEmail = profile.email && profile.email.indexOf('users.noreply.github.com') < 0;
    [user] = await Promise.all([
      userModel.add(
        userId, profile.name, hasEmail ? profile.email : undefined, profile.image,
        ctx.cookies.get(config.cookies.referral.key, config.cookies.referral.opts),
      ),
      provider.add(
        userId, providerName, res.access_token, profile.id,
        res.expires_in ? (new Date(Date.now() + (res.expires_in * 1000))) : null,
        res.refresh_token,
      ),
    ]);
    if (user.referral) {
      ctx.log.info({ userId: user.id, referral: user.referral }, 'referred user registered');
    }
    notifyNewUser(profile, providerName);
    if (hasEmail) {
      addUserToContacts(Object.assign({}, profile, { id: userId }), '85a1951f-5f0c-459f-bf5e-e5c742986a50')
        .catch((err) => {
          ctx.log.warn({ err }, `failed to add ${userId} to contacts`);
        });
    }
  }

  return Object.assign({}, user, {
    providers: [providerName],
    newUser,
  });
};

router.get(
  '/authorize',
  validator({
    query: {
      redirect_uri: string().required(),
      code_challenge: string().required(),
      provider: string().required(),
    },
  }, {
    stripUnknown: true,
  }),
  async (ctx) => {
    const { query } = ctx.request;
    const redirectUri = `${ctx.request.origin}/v1/auth/callback`;
    authorize(ctx, query.provider, redirectUri);
  },
);

router.get(
  '/callback',
  validator({
    query: {
      state: string(),
      code: string().required(),
    },
  }, {
    stripUnknown: true,
  }),
  ctx => callback(ctx, ctx.request.query.provider, (query, state) => ({
    providerCode: query.code,
    provider: state.provider,
    codeChallenge: state.code_challenge,
  })),
);

router.post(
  '/authenticate',
  validator({
    body: object().keys({
      code: string().required(),
      code_verifier: string().required(),
    }),
  }, {
    stripUnknown: true,
  }),
  async (ctx) => {
    const user = await authenticate(ctx, () => `${ctx.request.origin}/v1/auth/callback`);
    await setAuthCookie(ctx, user);

    ctx.log.info(`connected ${user.id} with ${user.providers[0]}`);
    ctx.status = 200;
    ctx.body = user;
  },
);

Object.keys(providersConfig).forEach((providerName) => {
  const redirectUri = ctx => `${ctx.request.origin}/v1/auth/${providerName}/callback`;

  router.get(
    `/${providerName}/authorize`,
    validator({
      query: {
        redirect_uri: string().required(),
      },
    }),
    ctx => authorize(ctx, providerName, redirectUri(ctx)),
  );

  router.get(`/${providerName}/callback`, ctx => callback(ctx, ctx.request.query.provider, query => ({
    providerCode: query.code,
    provider: providerName,
  })));

  router.post(
    `/${providerName}/authenticate`,
    validator({
      body: object().keys({
        code: string().required(),
      }),
    }, {
      stripUnknown: true,
    }),
    async (ctx) => {
      const user = await authenticate(ctx, () => redirectUri(ctx));
      const userId = user.id;
      const accessToken = await signJwt({ userId });
      const rfToken = refreshToken.generate(userId);
      await refreshToken.add(userId, rfToken);

      ctx.log.info(`connected ${userId} with ${providerName}`);

      ctx.status = 200;
      ctx.body = Object.assign({}, user, {
        accessToken: accessToken.token,
        expiresIn: accessToken.expiresIn,
        refreshToken: rfToken,
      });
    },
  );
});

router.post(
  '/refresh',
  validator({
    body: object().keys({
      refreshToken: string().required(),
    }),
  }, {
    stripUnknown: true,
  }),
  async (ctx) => {
    const { body } = ctx.request;
    const model = await refreshToken.getByToken(body.refreshToken);

    if (!model) {
      ctx.status = 403;
      return;
    }

    ctx.log.info(`refreshed token for ${model.userId}`);

    const accessToken = await signJwt({ userId: model.userId });
    ctx.status = 200;
    ctx.body = accessToken;
  },
);

export default router;
