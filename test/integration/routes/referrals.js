import knexCleaner from 'knex-cleaner';
import supertest from 'supertest';
import { expect } from 'chai';
import db, { migrate } from '../../../src/db';
import app from '../../../src';
import { sign as signJwt } from '../../../src/jwt';
import fixture from '../../fixtures/contests';
import contest from '../../../src/models/contest';

const boardFixture = [
  {
    id: '1',
    name: 'Ido',
    email: 'ido@acme.com',
    image: 'https://acme.com/ido.png',
    created_at: new Date('2020-07-01T00:00:00.000Z'),
  },
  {
    id: '2',
    name: 'Tsahi',
    email: 'tsahi@acme.com',
    image: 'https://acme.com/tsahi.png',
    created_at: new Date('2020-07-02T00:00:00.000Z'),
  },
  {
    id: '3',
    name: 'Nimrod',
    email: 'nimrod@acme.com',
    image: 'https://acme.com/nimrod.png',
    created_at: new Date('2020-07-03T00:00:00.000Z'),
  },
  {
    id: '4',
    name: 'Sophia',
    email: 'sophia@acme.com',
    image: 'https://acme.com/sophia.png',
    created_at: new Date('2020-07-11T00:00:00.000Z'),
    referral: '1',
  },
  {
    id: '5',
    name: 'Emma',
    email: 'emma@acme.com',
    image: 'https://acme.com/emma.png',
    created_at: new Date('2020-07-20T00:00:00.000Z'),
    referral: '1',
  },
  {
    id: '6',
    name: 'Isabella',
    email: 'isabella@acme.com',
    image: 'https://acme.com/isabella.png',
    created_at: new Date('2020-07-08T00:00:00.000Z'),
    referral: '1',
  },
  {
    id: '7',
    name: 'Olivia',
    email: 'olivia@acme.com',
    image: 'https://acme.com/olivia.png',
    created_at: new Date('2020-07-15T00:00:00.000Z'),
    referral: '2',
  },
  {
    id: '8',
    name: 'Ava',
    email: 'ava@acme.com',
    image: 'https://acme.com/ava.png',
    created_at: new Date('2020-07-21:00:00.000Z'),
    referral: '2',
  },
  {
    id: '9',
    name: 'Emily',
    email: 'emily@acme.com',
    image: 'https://acme.com/emily.png',
    created_at: new Date('2020-07-17T00:00:00.000Z'),
    referral: '3',
  },
];

describe('referrals routes', () => {
  let request;
  let server;

  beforeEach(async () => {
    await knexCleaner.clean(db, { ignoreTables: ['knex_migrations', 'knex_migrations_lock'] });
    await migrate();
    await db.insert(boardFixture).into('users');
    await Promise.all(fixture.map((f) => contest.add(
      f.startAt,
      f.endAt,
    )));
  });

  before(() => {
    server = app.listen();
    request = supertest(server);
  });

  after(() => {
    server.close();
  });

  it('should return referral link of logged in user', async () => {
    const accessToken = await signJwt({ userId: '1' });
    const res = await request
      .get('/v1/referrals/link')
      .set('Authorization', `Bearer ${accessToken.token}`)
      .expect(200);
    expect(res.body.link).to.deep.equal('https://api.daily.dev/get?r=1');
  });
});
