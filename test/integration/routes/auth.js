import { expect } from 'chai';
import supertest from 'supertest';
import nock from 'nock';
import knexCleaner from 'knex-cleaner';
import db, { migrate } from '../../../src/db';
import provider from '../../../src/models/provider';
import userModel from '../../../src/models/user';
import app from '../../../src';
import { sign } from '../../../src/jwt';
import { generateChallenge } from '../../../src/auth';

describe('auth routes', () => {
  let request;
  let server;

  beforeEach(async () => {
    await knexCleaner.clean(db, { ignoreTables: ['knex_migrations', 'knex_migrations_lock'] });
    return migrate();
  });

  before(() => {
    server = app.listen();
    request = supertest(server);
  });

  after(() => {
    server.close();
  });

  describe('oauth pkce', () => {
    it('should throw bad request', async () => {
      await request
        .post('/v1/auth/authenticate')
        .expect(400);
    });

    it('should throw forbidden when code is wrong', async () => {
      await request
        .post('/v1/auth/authenticate')
        .send({ code: 'code', code_verifier: 'verify' })
        .expect(403);
    });

    it('should throw forbidden when code challenge does not match verifier', async () => {
      const verifier = 'verify';
      const code = await sign({ providerCode: 'code', provider: 'github', codeChallenge: 'challenge' });
      await request
        .post('/v1/auth/authenticate')
        .send({ code: code.token, code_verifier: verifier })
        .expect(403);
    });

    it('should register a new user', async () => {
      nock('https://github.com')
        .post('/login/oauth/access_token', (body) => body.code === 'code')
        .reply(200, { access_token: 'token' });

      nock('https://api.github.com', {
        reqheaders: {
          Authorization: 'token token',
        },
      })
        .get('/user/public_emails')
        .reply(200, [{ email: 'email@foo.com' }]);

      nock('https://api.github.com', {
        reqheaders: {
          Authorization: 'token token',
          'User-Agent': 'Daily',
        },
      })
        .get('/user')
        .reply(200, { id: 'github_id', name: 'John', avatar_url: 'https://acme.com/john.png' });

      const verifier = 'verify';
      const code = await sign({
        providerCode: 'code',
        provider: 'github',
        codeChallenge: generateChallenge(verifier),
      });
      const res = await request
        .post('/v1/auth/authenticate')
        .send({ code: code.token, code_verifier: verifier })
        .expect(200);

      expect(res.body.newUser).to.equal(true);
      const model = await provider.getByUserId(res.body.id, 'github');
      expect(model.providerId).to.equal('github_id');
      const user = await userModel.getById(res.body.id);
      delete user.createdAt;
      expect(user).to.deep.equal({
        id: res.body.id,
        name: 'John',
        email: 'email@foo.com',
        image: 'https://acme.com/john.png',
        infoConfirmed: false,
        premium: false,
        acceptedMarketing: true,
        reputation: 1,
        referralLink: `https://api.daily.dev/get?r=${res.body.id}`,
      });
    });

    it('should login the existing in user', async () => {
      nock('https://github.com')
        .post('/login/oauth/access_token', (body) => body.code === 'code')
        .reply(200, { access_token: 'token' });

      nock('https://api.github.com', {
        reqheaders: {
          Authorization: 'token token',
          'User-Agent': 'Daily',
        },
      })
        .get('/user/public_emails')
        .reply(200, [{ email: 'email@foo.com' }]);

      nock('https://api.github.com', {
        reqheaders: {
          Authorization: 'token token',
          'User-Agent': 'Daily',
        },
      })
        .get('/user')
        .reply(200, { id: 'github_id' });

      const verifier = 'verify';
      const code = await sign({
        providerCode: 'code',
        provider: 'github',
        codeChallenge: generateChallenge(verifier),
      });

      await request
        .post('/v1/auth/authenticate')
        .send({ code: code.token, code_verifier: verifier })
        .expect(200);

      nock('https://github.com')
        .post('/login/oauth/access_token', (body) => body.code === 'code')
        .reply(200, { access_token: 'token2' });

      nock('https://api.github.com', {
        reqheaders: {
          Authorization: 'token token2',
          'User-Agent': 'Daily',
        },
      })
        .get('/user/public_emails')
        .reply(200, [{ email: 'email@foo.com' }]);

      nock('https://api.github.com', {
        reqheaders: {
          Authorization: 'token token2',
          'User-Agent': 'Daily',
        },
      })
        .get('/user')
        .reply(200, { id: 'github_id' });

      const res = await request
        .post('/v1/auth/authenticate')
        .send({ code: code.token, code_verifier: verifier })
        .expect(200);

      expect(res.body.newUser).to.equal(false);
    });
  });
});
