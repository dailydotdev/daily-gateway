import { expect } from 'chai';
import supertest from 'supertest';
import nock from 'nock';
import knexCleaner from 'knex-cleaner';
import db, { migrate } from '../../../src/db';
import app from '../../../src';
import role from '../../../src/models/role';
import userModel from '../../../src/models/user';
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
        .reply(200, { id: 'github_id', name: 'user', avatar_url: 'https://avatar.com' });

      const code = await sign({ providerCode: 'code', provider: 'github' });
      const { body } = await request
        .post('/v1/auth/github/authenticate')
        .send({ code: code.token })
        .expect(200);

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
        .reply(200, { id: 'github_id', name: 'user', avatar_url: 'https://avatar.com' });

      const res = await request
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${body.accessToken}`)
        .expect(200);

      delete res.body.createdAt;
      expect(res.body).to.deep.equal({
        id: body.id,
        providers: ['github'],
        name: 'user',
        image: 'https://avatar.com',
        email: 'email@foo.com',
        infoConfirmed: false,
        premium: false,
        acceptedMarketing: true,
        roles: [],
        reputation: 0,
        permalink: `http://localhost:5002/${res.body.id}`,
      });
    });

    it('should return profile with roles', async () => {
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
        .reply(200, { id: 'github_id', name: 'user', avatar_url: 'https://avatar.com' });

      const code = await sign({ providerCode: 'code', provider: 'github' });
      const { body } = await request
        .post('/v1/auth/github/authenticate')
        .send({ code: code.token })
        .expect(200);

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
        .reply(200, { id: 'github_id', name: 'user', avatar_url: 'https://avatar.com' });

      await role.add(body.id, 'admin');
      await role.add(body.id, 'moderator');

      const res = await request
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${body.accessToken}`)
        .expect(200);

      delete res.body.createdAt;
      expect(res.body).to.deep.equal({
        id: body.id,
        providers: ['github'],
        name: 'user',
        image: 'https://avatar.com',
        email: 'email@foo.com',
        infoConfirmed: false,
        premium: false,
        acceptedMarketing: true,
        roles: ['admin', 'moderator'],
        reputation: 0,
        permalink: `http://localhost:5002/${res.body.id}`,
      });
    });
  });

  describe('me info', () => {
    it('should return github profile', async () => {
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
        .reply(200, { id: 'github_id', name: 'user', avatar_url: 'https://avatar.com' });

      const code = await sign({ providerCode: 'code', provider: 'github' });
      const { body } = await request
        .post('/v1/auth/github/authenticate')
        .send({ code: code.token })
        .expect(200);

      nock('https://api.github.com', {
        reqheaders: {
          Authorization: 'token token',
          'User-Agent': 'Daily',
        },
      })
        .get('/user')
        .reply(200, { id: 'github_id', name: 'user', avatar_url: 'https://avatar.com' });

      nock('https://api.github.com', {
        reqheaders: {
          Authorization: 'token token',
          'User-Agent': 'Daily',
        },
      })
        .get('/user/public_emails')
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

  describe('update info', () => {
    it('should update the logged-in user info', async () => {
      await userModel.add('id', 'John');
      const accessToken = await sign({ userId: 'id' }, null);

      const res = await request
        .put('/v1/users/me')
        .set('Cookie', [`da3=${accessToken.token}`])
        .set('Content-Type', 'application/json')
        .send({
          name: 'John', email: 'john@acme.com', company: 'ACME', title: 'Developer',
        })
        .expect(200);

      delete res.body.createdAt;
      expect(res.body).to.deep.equal({
        id: 'id',
        name: 'John',
        email: 'john@acme.com',
        company: 'ACME',
        title: 'Developer',
        infoConfirmed: true,
        premium: false,
        acceptedMarketing: true,
        reputation: 0,
      });
    });

    it('should update the accepted marketing field', async () => {
      await userModel.add('id', 'John');
      const accessToken = await sign({ userId: 'id' }, null);

      const res = await request
        .put('/v1/users/me')
        .set('Cookie', [`da3=${accessToken.token}`])
        .set('Content-Type', 'application/json')
        .send({
          name: 'John', email: 'john@acme.com', company: 'ACME', title: 'Developer', acceptedMarketing: true,
        })
        .expect(200);

      delete res.body.createdAt;
      expect(res.body).to.deep.equal({
        id: 'id',
        name: 'John',
        email: 'john@acme.com',
        company: 'ACME',
        title: 'Developer',
        infoConfirmed: true,
        premium: false,
        acceptedMarketing: true,
        reputation: 0,
      });
    });

    it('should throw bad request on duplicate email', async () => {
      await userModel.add('id', 'John');
      await userModel.add('id2', 'John2', 'john@acme.com');
      const accessToken = await sign({ userId: 'id' }, null);

      const res = await request
        .put('/v1/users/me')
        .set('Cookie', [`da3=${accessToken.token}`])
        .set('Content-Type', 'application/json')
        .send({
          name: 'John', email: 'john@acme.com', company: 'ACME', title: 'Developer',
        })
        .expect(400);

      expect(res.body).to.deep.equal({
        code: 1,
        message: 'email already exists',
        field: 'email',
        reason: 'email already exists',
      });
    });

    it('should throw bad request on duplicate username', async () => {
      await userModel.add('id', 'John');
      await userModel.add('id2', 'John2');
      await userModel.update('id2', { username: 'idoshamun' });
      const accessToken = await sign({ userId: 'id' }, null);

      const res = await request
        .put('/v1/users/me')
        .set('Cookie', [`da3=${accessToken.token}`])
        .set('Content-Type', 'application/json')
        .send({
          name: 'John', email: 'john@acme.com', username: 'IdoShamun',
        })
        .expect(400);

      expect(res.body).to.deep.equal({
        code: 1,
        message: 'username already exists',
        field: 'username',
        reason: 'username already exists',
      });
    });

    it('should throw bad request on duplicate twitter handle', async () => {
      await userModel.add('id', 'John');
      await userModel.add('id2', 'John2');
      await userModel.update('id2', { twitter: 'idoshamun' });
      const accessToken = await sign({ userId: 'id' }, null);

      const res = await request
        .put('/v1/users/me')
        .set('Cookie', [`da3=${accessToken.token}`])
        .set('Content-Type', 'application/json')
        .send({
          name: 'John', email: 'john@acme.com', twitter: 'IdoShamun',
        })
        .expect(400);

      expect(res.body).to.deep.equal({
        code: 1,
        message: 'twitter handle already exists',
        field: 'twitter',
        reason: 'twitter handle already exists',
      });
    });

    it('should throw bad request on duplicate github handle', async () => {
      await userModel.add('id', 'John');
      await userModel.add('id2', 'John2');
      await userModel.update('id2', { github: 'idoshamun' });
      const accessToken = await sign({ userId: 'id' }, null);

      const res = await request
        .put('/v1/users/me')
        .set('Cookie', [`da3=${accessToken.token}`])
        .set('Content-Type', 'application/json')
        .send({
          name: 'John', email: 'john@acme.com', github: 'IdoShamun',
        })
        .expect(400);

      expect(res.body).to.deep.equal({
        code: 1,
        message: 'github handle already exists',
        field: 'github',
        reason: 'github handle already exists',
      });
    });

    it('should throw bad request on invalid username', async () => {
      await userModel.add('id', 'John');
      const accessToken = await sign({ userId: 'id' }, null);

      const res = await request
        .put('/v1/users/me')
        .set('Cookie', [`da3=${accessToken.token}`])
        .set('Content-Type', 'application/json')
        .send({
          name: 'John', email: 'john@acme.com', username: 'john$%^',
        })
        .expect(400);

      expect(res.body).to.deep.equal({
        code: 1,
        field: 'username',
        message: 'child "username" fails because ["username" with value "john&#x24;&#x25;&#x5e;" fails to match the required pattern: /^@?(\\w){1,15}$/]',
        reason: '"username" with value "john&#x24;&#x25;&#x5e;" fails to match the required pattern: /^@?(\\w){1,15}$/',
      });
    });
  });

  describe('get user profile', () => {
    it('should throw not found when no such user', async () => {
      await request
        .get('/v1/users/notfound')
        .expect(404);
    });

    it('should return profile by id', async () => {
      await userModel.add('id', 'John', 'john@acme.com', 'https://acme.com');
      await userModel.update('id', { username: 'idoshamun', bio: 'My bio' });

      const res = await request
        .get('/v1/users/id')
        .expect(200);

      delete res.body.createdAt;
      expect(res.body).to.deep.equal({
        id: 'id',
        name: 'John',
        image: 'https://acme.com',
        username: 'idoshamun',
        bio: 'My bio',
        premium: false,
        reputation: 0,
      });
    });

    it('should return profile by username', async () => {
      await userModel.add('id', 'John', 'john@acme.com', 'https://acme.com');
      await userModel.update('id', { username: 'idoshamun', bio: 'My bio' });

      const res = await request
        .get('/v1/users/idoshamun')
        .expect(200);

      delete res.body.createdAt;
      expect(res.body).to.deep.equal({
        id: 'id',
        name: 'John',
        image: 'https://acme.com',
        username: 'idoshamun',
        bio: 'My bio',
        premium: false,
        reputation: 0,
      });
    });
  });
});
