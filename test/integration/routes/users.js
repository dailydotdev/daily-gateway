import { expect } from 'chai';
import supertest from 'supertest';
import nock from 'nock';
import knexCleaner from 'knex-cleaner';
import db, { migrate } from '../../../src/db';
import app from '../../../src';
import role from '../../../src/models/role';
import { sign } from '../../../src/jwt';

describe('users routes', () => {
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

  describe('me', () => {
    it('should return github profile', async () => {
      nock('https://github.com')
        .post('/login/oauth/access_token', body => body.code === 'code')
        .reply(200, { access_token: 'token' });

      nock('https://api.github.com')
        .get('/user/public_emails')
        .query({ access_token: 'token' })
        .reply(200, [{ email: 'email@foo.com' }]);

      nock('https://api.github.com')
        .get('/user')
        .query({ access_token: 'token' })
        .reply(200, { id: 'github_id', name: 'user', avatar_url: 'https://avatar.com' });

      const code = await sign({ providerCode: 'code', provider: 'github' });
      const { body } = await request
        .post('/v1/auth/github/authenticate')
        .send({ code: code.token })
        .expect(200);

      nock('https://api.github.com')
        .get('/user/public_emails')
        .query({ access_token: 'token' })
        .reply(200, [{ email: 'email@foo.com' }]);

      nock('https://api.github.com')
        .get('/user')
        .query({ access_token: 'token' })
        .reply(200, { id: 'github_id', name: 'user', avatar_url: 'https://avatar.com' });

      const res = await request
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${body.accessToken}`)
        .expect(200);

      expect(res.body).to.deep.equal({
        id: body.id,
        providers: ['github'],
        name: 'user',
        image: 'https://avatar.com',
      });
    });
  });

  describe('me info', () => {
    it('should return github profile', async () => {
      nock('https://github.com')
        .post('/login/oauth/access_token', body => body.code === 'code')
        .reply(200, { access_token: 'token' });

      nock('https://api.github.com')
        .get('/user/public_emails')
        .query({ access_token: 'token' })
        .reply(200, [{ email: 'email@foo.com' }]);

      nock('https://api.github.com')
        .get('/user')
        .query({ access_token: 'token' })
        .reply(200, { id: 'github_id', name: 'user', avatar_url: 'https://avatar.com' });

      const code = await sign({ providerCode: 'code', provider: 'github' });
      const { body } = await request
        .post('/v1/auth/github/authenticate')
        .send({ code: code.token })
        .expect(200);

      nock('https://api.github.com')
        .get('/user')
        .query({ access_token: 'token' })
        .reply(200, { id: 'github_id', name: 'user', avatar_url: 'https://avatar.com' });

      nock('https://api.github.com')
        .get('/user/public_emails')
        .query({ access_token: 'token' })
        .reply(200, [{ email: 'email@foo.com' }]);

      const res = await request
        .get('/v1/users/me/info')
        .set('Authorization', `Bearer ${body.accessToken}`)
        .expect(200);

      expect(res.body).to.deep.equal({
        name: 'user',
        email: 'email@foo.com',
      });
    });
  });

  describe('me roles', () => {
    it('should return user\'s roles', async () => {
      nock('https://github.com')
        .post('/login/oauth/access_token', body => body.code === 'code')
        .reply(200, { access_token: 'token' });

      nock('https://api.github.com')
        .get('/user/public_emails')
        .query({ access_token: 'token' })
        .reply(200, [{ email: 'email@foo.com' }]);

      nock('https://api.github.com')
        .get('/user')
        .query({ access_token: 'token' })
        .reply(200, { id: 'github_id', name: 'user', avatar_url: 'https://avatar.com' });

      const code = await sign({ providerCode: 'code', provider: 'github' });
      const { body } = await request
        .post('/v1/auth/github/authenticate')
        .send({ code: code.token })
        .expect(200);

      await role.add(body.id, 'admin');
      await role.add(body.id, 'moderator');

      const res = await request
        .get('/v1/users/me/roles')
        .set('Authorization', `Bearer ${body.accessToken}`)
        .expect(200);

      expect(res.body).to.deep.equal(['admin', 'moderator']);
    });
  });
});
