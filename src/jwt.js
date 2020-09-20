import jwt from 'jsonwebtoken';
import koaJwt from 'koa-jwt';
import config from './config';

export const sign = (payload, expiration = config.jwt.expiresIn) => new Promise(
  (resolve, reject) => {
    const expiresIn = new Date(Date.now() + expiration);
    const newPayload = Object.assign(
      expiration ? ({ exp: expiresIn.getTime() / 1000 }) : {},
      payload,
    );
    jwt.sign(newPayload, config.jwt.secret, {
      audience: config.jwt.audience,
      issuer: config.jwt.issuer,
    }, (err, token) => {
      if (err) {
        return reject(err);
      }

      return resolve({
        token,
        expiresIn,
      });
    });
  },
);

export const verify = (token) => new Promise(
  (resolve, reject) => {
    jwt.verify(token, config.jwt.secret, {
      audience: config.jwt.audience,
      issuer: config.jwt.issuer,
    }, (err, payload) => {
      if (err) {
        return reject(err);
      }
      return resolve(payload);
    });
  },
);

export const verifyMiddleware = koaJwt({
  secret: config.jwt.secret,
  audience: config.jwt.audience,
  issuer: config.jwt.issuer,
  passthrough: true,
  getToken: (ctx) => ctx.request.query.access_token,
});
